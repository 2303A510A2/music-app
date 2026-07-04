export default function NowPlaying() {
  return (
    <div id="nowPlaying" className="now-playing">
      <div id="currentSong" className="current-song">No song playing</div>
      <div id="soundCloudPlayer" className="soundcloud-player"></div>
      <div className="player-controls">
        <button className="ctrl-btn" title="Previous">⏮</button>
        <button className="ctrl-btn" title="Rewind 10s">⏪</button>
        <button className="ctrl-btn" title="Forward 10s">⏩</button>
        <button className="ctrl-btn" title="Next">⏭</button>
        <button className="ctrl-btn" title="Favorite" id="favBtn">🤍</button>
        <button className="ctrl-btn" title="More" id="playerDotsBtn">⋮</button>
      </div>
    </div>
  );
}
