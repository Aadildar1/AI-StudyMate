import os
import requests


def search_youtube_videos(topic):
    """Return up to three related YouTube videos.

    Video recommendations are a secondary feature, so any failure
    (missing key, quota exhausted, network error) returns an empty list
    instead of failing the whole lesson request.
    """

    api_key = os.getenv("YOUTUBE_API_KEY")

    if not api_key:
        print("YOUTUBE_API_KEY not set; skipping video search.")
        return []

    url = "https://www.googleapis.com/youtube/v3/search"

    params = {
        "part": "snippet",
        "q": f"{topic} tutorial explanation",
        "type": "video",
        "maxResults": 3,
        "key": api_key,
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError) as error:
        print(f"YouTube search failed: {error}")
        return []

    videos = []

    for item in data.get("items", []):

        video_id = item.get("id", {}).get("videoId")
        snippet = item.get("snippet", {})

        if not video_id:
            continue

        videos.append({
            "title": snippet.get("title", ""),
            "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            "video_url": f"https://www.youtube.com/watch?v={video_id}"
        })

    return videos
