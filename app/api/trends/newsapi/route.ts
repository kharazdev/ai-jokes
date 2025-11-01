import { NextResponse } from 'next/server';

// A simple type for an article object from NewsAPI
interface Article {
  title: string;
  // We only care about the title, so no need to type the other properties
}

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY;
  const apiUrl = `https://newsapi.org/v2/top-headlines?country=eg&apiKey=${apiKey}`;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is missing' }, { status: 500 });
  }

  try {
    const response = await fetch(apiUrl, {
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `NewsAPI error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // --- CHANGE IS HERE ---
    // 1. Check if the 'articles' array exists.
    if (!data.articles || !Array.isArray(data.articles)) {
      return NextResponse.json({ titles: data}); // Return empty array if no articles
    }

    // 2. Use .map() to create a new array containing only the titles.
    const titles: string[] = data.articles.map((article: Article) => article.title);

    // 3. Return the new array of titles.
    return NextResponse.json({ data });
    // --- END OF CHANGE ---

  } catch (error) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news data' },
      { status: 500 }
    );
  }
}