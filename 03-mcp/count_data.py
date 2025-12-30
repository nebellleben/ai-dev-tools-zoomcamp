"""Count occurrences of 'data' on a web page."""

from web_downloader import download_webpage


def count_word_occurrences(text: str, word: str) -> int:
    """
    Count case-insensitive occurrences of a word in text.
    
    Args:
        text: The text to search in
        word: The word to count
    
    Returns:
        The number of occurrences
    """
    # Convert to lowercase for case-insensitive matching
    text_lower = text.lower()
    word_lower = word.lower()
    
    # Count occurrences
    count = text_lower.count(word_lower)
    return count


def main():
    """Download webpage and count 'data' occurrences."""
    url = "https://datatalks.club/"
    
    print(f"Downloading content from: {url}")
    print("=" * 60)
    
    try:
        # Download the webpage content
        content = download_webpage(url)
        
        # Count occurrences of "data"
        count = count_word_occurrences(content, "data")
        
        print(f"Successfully downloaded {len(content)} characters")
        print(f"\nThe word 'data' appears {count} times (case-insensitive)")
        print("=" * 60)
        
    except Exception as e:
        print(f"Error: {e}")
        raise


if __name__ == "__main__":
    main()

