import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../css/main.css";
import "../css/premium.css";
import "../css/forum.css";


export default function PlayerStoryPage() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    async function fetchStory() {
      try {
        const res = await fetch(`/api/premium/player/${id}`);
        const data = await res.json();
        setPlayer(data);
      } catch (err) {
        console.error("加载玩家故事失败:", err);
      }
    }
    fetchStory();
  }, [id]);

  if (!player) {
    return (
      <div className="loading-screen">
        <p>加载玩家故事中...</p>
      </div>
    );
  }

  return (
    <div className="player-story-page">

      {/* 顶部故事封面 */}
      <header className="story-hero">
        <img src={player.heroImg} alt={player.name} />
        <div className="story-hero-text">
          <h1>{player.name}</h1>
          <p>{player.tagline}</p>
        </div>
      </header>

      {/* 故事内容 */}
      <main className="story-content">

        <section className="story-section">
          <h2>玩家故事 / Story</h2>

          <div className="story-timeline-vertical">
            {player.story?.map((paragraph, i) => (
              <div key={i} className="story-node">
                <div className="story-node-dot"></div>
                <div className="story-node-line"></div>
                <p>{paragraph}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

    </div>
  );
}
