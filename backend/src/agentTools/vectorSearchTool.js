import { formatContextArray } from "../utils/dataHandler.js";
import MilvusDatabase from "../databases/milvus.js";
import { openaiService } from "../serviceConfigs/OpenAIService.js";
import { MODELS } from "../utils/constants.js";
import dotenv from "dotenv";
dotenv.config({ path: "./configs/.env" });

export async function vectorSearchTool(query) {
  try {
    console.log("Performing vector search for the query:", query);

    const vectorClient = await MilvusDatabase.getMilvusClient();

    // Use embedding service
    const embedding = await openaiService.embedding(
      query.query,
      MODELS.EMBEDDING_MODEL
    );

    // Call the vector search function, now using the injected client
    const results = await searchVectors({
      client: vectorClient,
      embedding,
      topK: 5,
      collection: process.env.MILVUS_COLLECTION_NAME,
      outputFields: [
        "id",
        "content_type",
        "original_data",
        "text_for_embedding",
      ],
      minScore: 0.4,
    });

    const filteredResults = results.filter((result) => result.score >= 0.4);
    const retrievedContext = filteredResults.map((result) => ({
      data: result.data,
    }));
    const formattedContext = formatContextArray(retrievedContext);

    console.log("Vector search results count:", formattedContext.length);
    return formattedContext;
  } catch (error) {
    console.error("Error in vectorSearchTool:", error);
    throw error;
  }
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
