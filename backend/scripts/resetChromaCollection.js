require('dotenv').config({ path: './.env' });
const { ChromaClient } = require('chromadb');

const CHROMA_COLLECTION_NAME = 'products';

const chromaClient = new ChromaClient();

async function resetCollection() {
  try {
    console.log(`Vérification de l'existence de la collection "${CHROMA_COLLECTION_NAME}"...`);
    await chromaClient.deleteCollection({ name: CHROMA_COLLECTION_NAME });
    console.log(` Collection "${CHROMA_COLLECTION_NAME}" supprimée.`);

    // Recrée la collection vide avec un espace vectoriel défini
    await chromaClient.getOrCreateCollection({
      name: CHROMA_COLLECTION_NAME,
      metadata: { "hnsw:space": "cosine" }
    });
    console.log(` Collection "${CHROMA_COLLECTION_NAME}" recréée avec succès.`);

  } catch (error) {
    console.error(" Erreur lors du reset de la collection:", error);
  }
}

resetCollection();
