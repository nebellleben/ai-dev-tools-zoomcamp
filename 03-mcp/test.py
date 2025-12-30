"""Test script for the web downloader function."""

from web_downloader import download_webpage


def main():
    """Test the download_webpage function."""
    # Test with the GitHub repository URL
    test_url = "https://github.com/alexeygrigorev/minsearch"
    
    print(f"Downloading content from: {test_url}")
    print("=" * 60)
    
    try:
        content = download_webpage(test_url)
        print(f"Successfully downloaded {len(content)} characters")
        print("\nFirst 500 characters of content:")
        print("-" * 60)
        print(content[:500])
        print("-" * 60)
        print("\n✓ Test passed!")
    except Exception as e:
        print(f"✗ Test failed with error: {e}")
        raise


if __name__ == "__main__":
    main()

