import os
import requests


def search_youtube_videos(topic):

    api_key = os.getenv("YOUTUBE_API_KEY")

    url = "https://www.googleapis.com/youtube/v3/search"

    params = {
        "part": "snippet",
        "q": f"{topic} tutorial explanation",
        "type": "video",
        "maxResults": 3,
        "key": api_key,
    }

    response = requests.get(
        url,
        params=params,
        timeout=10
    )

    response.raise_for_status()

    data = response.json()

    videos = []

    for item in data["items"]:

        video_id = item["id"]["videoId"]

        video = {
            "title": item["snippet"]["title"],
            "thumbnail": item["snippet"]["thumbnails"]["high"]["url"],
            "video_url": f"https://www.youtube.com/watch?v={video_id}"
        }

        videos.append(video)

    return videos