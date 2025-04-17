import { formatContextArray } from "../utils/dataHandler.js";
import MilvusDatabase from "../databases/milvus.js";
import { openaiService } from "../serviceConfigs/OpenAIService.js";

function init() {
  async function execute({ query, toolParams }) {
    console.log("Performing vector search for the query:", query.query);

    const vectorClient = await MilvusDatabase.getMilvusClient();

    // Use embedding service
    const embedding = await openaiService.embedding(
      query.query,
      toolParams.embeddingModel
    );

    // Call the vector search function, now using the injected client
    const results = await searchVectors({
      client: vectorClient,
      embedding,
      topK: toolParams.topK || 5,
      collection: toolParams.collectionName,
      outputFields: toolParams.outputFields || [],
      minScore: toolParams.minScore || 0.4,
    });

    const filteredResults = results.filter(
      (result) => result.score >= (toolParams.minScore || 0.4)
    );
    const retrievedContext = filteredResults.map((result) => ({
      data: result.data,
    }));
    const formattedContext = formatContextArray(retrievedContext);

    console.log("Vector search results count:", formattedContext.length);
    return formattedContext;
  }

  return { execute };
}

async function searchVectors({
  client,
  embedding,
  topK,
  collection,
  outputFields,
  nprobe = 100,
}) {
  const searchParams = {
    collection_name: collection,
    vector: embedding,
    search_params: {
      anns_field: "vector",
      topk: topK,
      metric_type: "COSINE",
      params: JSON.stringify({ nprobe }),
    },
    output_fields: outputFields,
  };

  try {
    const results = await client.search(searchParams);
    return results.results.map((result) => ({
      id: result?.id,
      score: result?.score,
      content_type: result?.content_type,
      data: result?.original_data,
      text: result?.text_for_embedding,
    }));
  } catch (error) {
    console.error("Search failed:", error);
    throw error;
  }
}

export { init };
