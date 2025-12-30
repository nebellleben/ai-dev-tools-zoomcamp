"""Web page content downloader using Jina Reader."""

import requests


def download_webpage(url: str) -> str:
    """
    Download content of a web page using Jina Reader.
    
    Args:
        url: The URL of the web page to download (e.g., "http://datatalks.club")
    
    Returns:
        The content of the web page as a string
    
    Raises:
        requests.RequestException: If the request fails
    """
    # Construct the Jina Reader URL by prepending r.jina.ai
    jina_url = f"https://r.jina.ai/{url}"
    
    # Make the request
    response = requests.get(jina_url)
    response.raise_for_status()  # Raise an exception for bad status codes
    
    return response.text

