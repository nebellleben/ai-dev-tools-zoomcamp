"""FastMCP server for web page content downloading and documentation search."""

from fastmcp import FastMCP
import requests
from minsearch import Index
from search import (
    download_zip_if_needed,
    extract_and_process_files,
    create_index,
    search_documents as search_docs,
)

mcp = FastMCP("Web Scraper & Documentation Search 🕷️📚")

# Cache for the documentation index
_documentation_index: Index | None = None


def get_documentation_index() -> Index:
    """
    Get or create the FastMCP documentation search index.
    Downloads and indexes the documentation if not already done.
    
    Returns:
        The minsearch Index object for FastMCP documentation
    """
    global _documentation_index
    
    if _documentation_index is not None:
        return _documentation_index
    
    # Configuration
    zip_url = "https://github.com/jlowin/fastmcp/archive/refs/heads/main.zip"
    zip_path = "fastmcp-main.zip"
    
    # Download zip if needed
    download_zip_if_needed(zip_url, zip_path)
    
    # Extract and process files
    documents = extract_and_process_files(zip_path)
    
    if not documents:
        raise ValueError("No documents found to index!")
    
    # Create index
    _documentation_index = create_index(documents)
    
    return _documentation_index


@mcp.tool
def download_webpage(url: str) -> str:
    """
    Download content of a web page using Jina Reader.
    
    To use Jina Reader, simply prepend r.jina.ai to the URL.
    For example, to download http://datatalks.club, 
    visit https://r.jina.ai/https://datatalks.club.
    
    Args:
        url: The URL of the web page to download (e.g., "https://datatalks.club")
    
    Returns:
        The content of the web page as a string (markdown format from Jina Reader)
    
    Raises:
        requests.RequestException: If the request fails
    """
    # Construct the Jina Reader URL by prepending r.jina.ai
    jina_url = f"https://r.jina.ai/{url}"
    
    # Make the request
    response = requests.get(jina_url)
    response.raise_for_status()  # Raise an exception for bad status codes
    
    return response.text


def _search_documentation_impl(query: str, num_results: int = 5) -> list[dict]:
    """
    Internal implementation of documentation search.
    
    Args:
        query: The search query string
        num_results: Number of results to return (default: 5, max: 10)
    
    Returns:
        A list of dictionaries containing search results
    """
    # Limit num_results to reasonable range
    num_results = min(max(1, num_results), 10)
    
    # Get or create the index
    index = get_documentation_index()
    
    # Perform search
    results = search_docs(index, query, num_results=num_results)
    
    # Format results for return
    formatted_results = []
    for result in results:
        if isinstance(result, dict):
            formatted_results.append({
                "filename": result.get("filename", "Unknown"),
                "content": result.get("content", ""),
                "score": result.get("score", result.get("_score", 0)),
            })
        else:
            # Handle non-dict results
            formatted_results.append({
                "filename": getattr(result, "filename", "Unknown"),
                "content": getattr(result, "content", ""),
                "score": getattr(result, "score", getattr(result, "_score", 0)),
            })
    
    return formatted_results


@mcp.tool
def search_documentation(query: str, num_results: int = 5) -> list[dict]:
    """
    Search the FastMCP documentation for relevant documents.
    
    This tool searches through the FastMCP documentation (downloaded from GitHub)
    and returns the most relevant documents matching your query. The documentation
    is automatically downloaded and indexed on first use.
    
    Args:
        query: The search query string (e.g., "getting started", "MCP server", "tools")
        num_results: Number of results to return (default: 5, max: 10)
    
    Returns:
        A list of dictionaries containing search results. Each result includes:
        - filename: The path to the documentation file
        - content: The text content of the file
        - score: Relevance score (if available)
    
    Example:
        search_documentation("how to create a tool") -> Returns top 5 relevant docs
    """
    return _search_documentation_impl(query, num_results)


if __name__ == "__main__":
    mcp.run()
