import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

// Helper function to infer sentiment from feedback answers
const inferSentimentFromAnswers = (answers) => {
  if (!Array.isArray(answers) || answers.length === 0) {
    return null;
  }

  // Count positive and negative indicators
  let positiveIndicators = 0;
  let negativeIndicators = 0;
  let neutralIndicators = 0;

  answers.forEach(answer => {
    // Check vote type answers (true = positive, false = negative)
    if (answer.type === 'vote' && typeof answer.vote === 'boolean') {
      if (answer.vote) positiveIndicators++;
      else negativeIndicators++;
    }
    
    // Check rating type answers (1-5 scale)
    if (answer.type === 'rating' && typeof answer.rating === 'number') {
      if (answer.rating >= 4) positiveIndicators++;
      else if (answer.rating <= 2) negativeIndicators++;
      else neutralIndicators++;
    }
    
    // Check text answers for keywords
    if (answer.type === 'text' && answer.text) {
      const text = answer.text.toLowerCase();
      const positiveWords = ['good', 'great', 'excellent', 'awesome', 'love', 'like', 'happy', 'satisfied'];
      const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'unhappy', 'angry', 'frustrated'];
      
      if (positiveWords.some(word => text.includes(word))) positiveIndicators++;
      if (negativeWords.some(word => text.includes(word))) negativeIndicators++;
    }
  });

  // Determine overall sentiment based on indicators
  if (positiveIndicators > negativeIndicators && positiveIndicators > neutralIndicators) {
    return 'Positive';
  } else if (negativeIndicators > positiveIndicators && negativeIndicators > neutralIndicators) {
    return 'Negative';
  } else if (positiveIndicators > 0 || negativeIndicators > 0) {
    return 'Neutral';
  }
  
  return null; // Can't determine sentiment
};

const SentimentChart = ({ data, width = 400, height = 300 }) => {
  const chartRef = useRef();

  useEffect(() => {
    // Handle both direct array and paginated response formats
    const feedbackItems = Array.isArray(data) 
      ? data 
      : (data?.feedbacks || []);
      
    if (!feedbackItems || feedbackItems.length === 0) {
      console.log('No feedback items found in the data');
      if (data && typeof data === 'object') {
        console.log('Available data structure:', {
          keys: Object.keys(data),
          isPaginated: 'feedbacks' in data,
          totalItems: data.totalFeedback || 0
        });
      }
      return;
    }
  
    // Log the complete data structure in a copyable format
    console.log('=== FULL SENTIMENT DATA (copy this JSON) ===');
    console.log(JSON.stringify({
      metadata: {
        totalItems: feedbackItems.length,
        timestamp: new Date().toISOString(),
        fields: feedbackItems.length > 0 ? Object.keys(feedbackItems[0]) : [],
        isPaginated: !Array.isArray(data),
        paginationInfo: !Array.isArray(data) ? {
          totalPages: data.totalPages,
          currentPage: data.currentPage,
          totalFeedback: data.totalFeedback
        } : undefined
      },
      items: feedbackItems.map((item, index) => ({
        id: item._id || `item-${index}`,
        hasOverallSentiment: 'overallSentiment' in item,
        hasSentiment: 'sentiment' in item,
        overallSentiment: item.overallSentiment,
        sentiment: item.sentiment,
        hasAnswers: Array.isArray(item.answers),
        answerTypes: Array.isArray(item.answers) 
          ? [...new Set(item.answers.map(a => a.type))] 
          : [],
        createdAt: item.createdAt,
        // Include a few answers for reference (limited to avoid huge logs)
        sampleAnswers: Array.isArray(item.answers) 
          ? item.answers.slice(0, 3).map(a => ({
              type: a.type,
              text: a.text ? a.text.substring(0, 50) + (a.text.length > 50 ? '...' : '') : undefined,
              vote: a.vote,
              rating: a.rating,
              questionText: a.questionText
            }))
          : []
      })),
      summary: {
        totalItems: feedbackItems.length,
        itemsWithOverallSentiment: feedbackItems.filter(d => d.overallSentiment).length,
        itemsWithSentiment: feedbackItems.filter(d => d.sentiment).length,
        itemsWithAnswers: feedbackItems.filter(d => Array.isArray(d.answers) && d.answers.length > 0).length,
        uniqueSentiments: [...new Set(feedbackItems.map(d => d.overallSentiment || d.sentiment).filter(Boolean))]
      }
    }, null, 2));
    console.log('=== END OF SENTIMENT DATA ===');

    // Debug: Log the first few data items to check structure
    const analysisData = {
      analysis: {
        sampleSize: feedbackItems.length,
        firstItem: feedbackItems[0] ? {
          id: feedbackItems[0]._id,
          hasOverallSentiment: 'overallSentiment' in feedbackItems[0],
          hasSentiment: 'sentiment' in feedbackItems[0],
          answerCount: feedbackItems[0].answers?.length || 0,
          answerTypes: feedbackItems[0].answers ? [...new Set(feedbackItems[0].answers.map(a => a.type))] : []
        } : 'No items available',
        allSentiments: [...new Set(feedbackItems.map(d => d.overallSentiment || d.sentiment || 'none'))],
        answerStats: {
          totalWithAnswers: feedbackItems.filter(d => d.answers?.length > 0).length,
          answerTypes: [...new Set(feedbackItems.flatMap(d => d.answers?.map(a => a.type) || []))]
        },
        sampleAnswers: feedbackItems[0]?.answers?.slice(0, 3).map(a => ({
          type: a.type,
          hasText: !!a.text,
          textPreview: a.text ? a.text.substring(0, 50) + (a.text.length > 50 ? '...' : '') : undefined,
          hasVote: 'vote' in a,
          voteValue: a.vote,
          hasRating: 'rating' in a,
          ratingValue: a.rating,
          questionText: a.questionText
        })) || 'No answers available'
      }
    };
    
    console.log('=== SENTIMENT CHART DATA ANALYSIS ===');
    console.log(JSON.stringify(analysisData, null, 2));
    console.log('=== END OF ANALYSIS ===');
    
    // Also log the first item's full structure for reference
    if (feedbackItems.length > 0) {
      console.log('First feedback item structure (first 3 answers):', {
        ...feedbackItems[0],
        answers: feedbackItems[0].answers?.slice(0, 3).map(a => ({
          ...a,
          text: a.text ? a.text.substring(0, 100) + (a.text.length > 100 ? '...' : '') : a.text
        }))
      });
    }

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    // Set up the chart dimensions and margins
    const margin = { top: 40, right: 30, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear any existing chart
    d3.select(chartRef.current).selectAll('*').remove();

    // Create the SVG container
    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Process data for the chart - handle different possible property names
    const sentimentCounts = {
      Positive: 0,
      Neutral: 0,
      Negative: 0
    };
    
    // If no feedback items, show a message
    if (feedbackItems.length === 0) {
      svg.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .text('No feedback data available');
      return;
    }
    
    // Count each sentiment
    console.log('Processing feedback items for sentiment analysis...');
    let missingSentimentCount = 0;
    let analyzedFeedback = [];
    
    data.forEach((d, index) => {
      const sentiment = d.overallSentiment || d.sentiment;
      
      if (!sentiment) {
        // Try to infer sentiment from answers if not explicitly set
        const inferredSentiment = inferSentimentFromAnswers(d.answers);
        
        if (inferredSentiment) {
          console.log(`Inferred ${inferredSentiment} sentiment for feedback ${d._id || index} from answers`);
          sentimentCounts[inferredSentiment] = (sentimentCounts[inferredSentiment] || 0) + 1;
          analyzedFeedback.push({...d, inferredSentiment});
          return;
        }
        
        missingSentimentCount++;
        return; // Skip this item if no sentiment can be inferred
      }
      
      if (typeof sentiment === 'string') {
        const normalizedSentiment = sentiment.charAt(0).toUpperCase() + sentiment.slice(1).toLowerCase();
        if (normalizedSentiment in sentimentCounts) {
          sentimentCounts[normalizedSentiment]++;
          analyzedFeedback.push({...d, normalizedSentiment});
        } else {
          console.warn('Unexpected sentiment value:', {
            value: sentiment,
            normalized: normalizedSentiment,
            feedbackId: d._id
          });
          // Categorize unexpected values as Neutral
          sentimentCounts.Neutral++;
          analyzedFeedback.push({...d, normalizedSentiment: 'Neutral'});
        }
      } else {
        console.warn('Non-string sentiment value:', {
          type: typeof sentiment,
          value: sentiment,
          feedbackId: d._id
        });
        // Default to Neutral for non-string values
        sentimentCounts.Neutral++;
        analyzedFeedback.push({...d, normalizedSentiment: 'Neutral'});
      }
    });
    
    // Log analysis results
    console.log('Sentiment analysis results:', {
      totalItems: data.length,
      analyzedItems: Object.values(sentimentCounts).reduce((a, b) => a + b, 0),
      missingSentimentCount,
      sentimentCounts,
      sampleAnalyzedFeedback: analyzedFeedback.slice(0, 3)
    });
    
    if (missingSentimentCount > 0) {
      console.warn(`Warning: ${missingSentimentCount} feedback items (${(missingSentimentCount/data.length*100).toFixed(1)}%) are missing sentiment data`);
    }
    
    // Convert to array format for D3
    const sentimentData = Object.entries(sentimentCounts).map(([sentiment, count]) => ({
      sentiment,
      count
    }));
    
    console.log('Processed sentiment data:', sentimentData);
    
    console.log('Processed sentiment data:', sentimentData);

    // Set up scales
    const x = d3.scaleBand()
      .domain(sentimentData.map(d => d.sentiment))
      .range([0, innerWidth])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(sentimentData, d => d.count) + 1])
      .nice()
      .range([innerHeight, 0]);

    // Add x-axis
    svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
        .attr('text-anchor', 'middle')
        .attr('fill', '#6B7280');

    // Add y-axis
    svg.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
        .attr('fill', '#6B7280');

    // Add bars
    svg.selectAll('.bar')
      .data(sentimentData)
      .enter()
      .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.sentiment))
        .attr('y', d => y(d.count))
        .attr('width', x.bandwidth())
        .attr('height', d => innerHeight - y(d.count))
        .attr('fill', d => {
          switch(d.sentiment) {
            case 'Positive': return '#10B981'; // Green
            case 'Neutral': return '#F59E0B'; // Yellow
            case 'Negative': return '#EF4444'; // Red
            default: return '#3B82F6'; // Blue
          }
        })
        .attr('rx', 4)
        .attr('ry', 4);

    // Add count labels
    svg.selectAll('.bar-label')
      .data(sentimentData)
      .enter()
      .append('text')
        .attr('class', 'bar-label')
        .attr('x', d => x(d.sentiment) + x.bandwidth() / 2)
        .attr('y', d => y(d.count) - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#1F2937')
        .text(d => d.count || '');

    // Add chart title
    svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151')
      .text('Feedback Sentiment Analysis');

  }, [data, width, height]);

  return <div ref={chartRef} className="bg-white p-4 rounded-lg shadow" />;
};

export default SentimentChart;
