"""Search implementation for FastMCP documentation using minsearch."""

import os
import zipfile
import requests
from pathlib import Path
from minsearch import Index


def download_zip_if_needed(url: str, local_path: str) -> None:
    """
    Download a zip file only if it doesn't already exist.
    
    Args:
        url: URL of the zip file to download
        local_path: Local path where the zip file should be saved
    """
    if os.path.exists(local_path):
        print(f"Zip file already exists at {local_path}, skipping download.")
        return
    
    print(f"Downloading {url}...")
    response = requests.get(url)
    response.raise_for_status()
    
    with open(local_path, 'wb') as f:
        f.write(response.content)
    
    print(f"Downloaded {len(response.content)} bytes to {local_path}")


def extract_and_process_files(zip_path: str) -> list[dict]:
    """
    Extract zip file and process .md and .mdx files.
    Remove the first part of the path in filenames.
    
    Args:
        zip_path: Path to the zip file
    
    Returns:
        List of dictionaries with 'filename' and 'content' fields
    """
    documents = []
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        # Get all file names in the zip
        all_files = zip_ref.namelist()
        
        # Filter for .md and .mdx files
        md_files = [f for f in all_files if f.endswith('.md') or f.endswith('.mdx')]
        
        print(f"Found {len(md_files)} markdown files in zip")
        
        for file_path in md_files:
            # Remove the first part of the path
            # e.g., "fastmcp-main/docs/getting-started/welcome.mdx" -> "docs/getting-started/welcome.mdx"
            parts = Path(file_path).parts
            if len(parts) > 1:
                # Remove first part (e.g., "fastmcp-main")
                new_path = str(Path(*parts[1:]))
            else:
                new_path = file_path
            
            # Read file content
            try:
                content = zip_ref.read(file_path).decode('utf-8')
                documents.append({
                    'filename': new_path,
                    'content': content
                })
            except UnicodeDecodeError:
                print(f"Warning: Could not decode {file_path}, skipping...")
                continue
    
    print(f"Processed {len(documents)} documents")
    return documents


def create_index(documents: list[dict]) -> Index:
    """
    Create a minsearch index from documents.
    
    Args:
        documents: List of dictionaries with 'filename' and 'content' fields
    
    Returns:
        Fitted Index object
    """
    print("Creating search index...")
    
    # Create index with text_fields for content and filename
    # We'll search primarily on content, but filename can also be searched
    index = Index(
        text_fields=["content", "filename"]
    )
    
    # Fit the index with documents
    index.fit(documents)
    
    print(f"Index created with {len(documents)} documents")
    return index


def search_documents(index: Index, query: str, num_results: int = 5) -> list[dict]:
    """
    Search for documents and return the most relevant results.
    
    Args:
        index: The minsearch Index object
        query: Search query string
        num_results: Number of results to return (default: 5)
    
    Returns:
        List of dictionaries containing search results with scores
    """
    # Perform search with boost on content field (more important than filename)
    boost_dict = {
        "content": 2.0,  # Content matches are twice as important
        "filename": 1.0  # Filename matches have normal importance
    }
    
    results = index.search(query, boost_dict=boost_dict)
    
    # Return top num_results
    return results[:num_results]


def main():
    """Main function to test the search implementation."""
    # Configuration
    zip_url = "https://github.com/jlowin/fastmcp/archive/refs/heads/main.zip"
    zip_path = "fastmcp-main.zip"
    
    print("=" * 60)
    print("FastMCP Documentation Search")
    print("=" * 60)
    
    # Step 1: Download zip if needed
    download_zip_if_needed(zip_url, zip_path)
    
    # Step 2: Extract and process files
    documents = extract_and_process_files(zip_path)
    
    if not documents:
        print("No documents found to index!")
        return
    
    # Step 3: Create index
    index = create_index(documents)
    
    # Step 4: Test search
    print("\n" + "=" * 60)
    print("Testing Search Functionality")
    print("=" * 60)
    
    test_queries = [
        "getting started",
        "MCP server",
        "tools and resources",
        "installation"
    ]
    
    for query in test_queries:
        print(f"\nQuery: '{query}'")
        print("-" * 60)
        results = search_documents(index, query, num_results=5)
        
        for i, result in enumerate(results, 1):
            # Handle different result formats - minsearch may return dicts or other formats
            if isinstance(result, dict):
                filename = result.get('filename', 'Unknown')
                score = result.get('score', result.get('_score', 0))
                content = result.get('content', '')
            else:
                # If result is not a dict, try to access attributes
                filename = getattr(result, 'filename', 'Unknown')
                score = getattr(result, 'score', getattr(result, '_score', 0))
                content = getattr(result, 'content', '')
            
            print(f"{i}. {filename}")
            if score:
                print(f"   Score: {score:.4f}")
            # Show a snippet of content
            snippet = content[:100].replace('\n', ' ') if content else ''
            if snippet:
                print(f"   Preview: {snippet}...")
    
    print("\n" + "=" * 60)
    print("✓ Search implementation test completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()

