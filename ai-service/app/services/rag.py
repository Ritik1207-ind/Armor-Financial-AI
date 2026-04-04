"""
Armor AI Service - RAG Service (Stub)
=======================================
Placeholder for future Retrieval Augmented Generation (RAG) feature.
This module will enable context-aware financial analysis by retrieving
relevant past conversations and financial knowledge.

NOTE: This is a STUB — not yet implemented.
"""

import logging

logger = logging.getLogger("armor.rag")


async def retrieve_context(query: str, user_id: str = None) -> list:
    """
    Retrieve relevant context from past conversations for RAG-enhanced analysis.
    
    Args:
        query: The search query / current conversation text
        user_id: Optional user ID to filter personal conversation history
    
    Returns:
        List of relevant context snippets (currently empty — stub)
    """
    logger.info(f"📚 RAG retrieve_context called (stub) - query length: {len(query)}")
    # TODO: Implement vector search against conversation history
    # TODO: Integrate with a vector database (e.g., ChromaDB, Pinecone)
    return []


async def build_rag_prompt(query: str, contexts: list) -> str:
    """
    Build an augmented prompt using retrieved context.
    
    Args:
        query: The original user query
        contexts: List of retrieved context snippets
    
    Returns:
        Augmented prompt string (currently returns original query — stub)
    """
    logger.info(f"📚 RAG build_rag_prompt called (stub) - {len(contexts)} contexts")
    # TODO: Combine retrieved contexts with the query for enhanced analysis
    return query


async def index_conversation(conversation_id: str, text: str, metadata: dict = None) -> bool:
    """
    Index a new conversation for future retrieval.
    
    Args:
        conversation_id: Unique conversation identifier
        text: Conversation text to index
        metadata: Additional metadata (entities, sentiment, etc.)
    
    Returns:
        True if indexed successfully (currently always True — stub)
    """
    logger.info(f"📚 RAG index_conversation called (stub) - id: {conversation_id}")
    # TODO: Store conversation embedding in vector database
    return True
