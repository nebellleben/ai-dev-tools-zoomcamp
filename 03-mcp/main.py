"""FastMCP server for web page content downloading using Jina Reader."""

from fastmcp import FastMCP
import requests

mcp = FastMCP("Web Scraper 🕷️")


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


if __name__ == "__main__":
    mcp.run()
