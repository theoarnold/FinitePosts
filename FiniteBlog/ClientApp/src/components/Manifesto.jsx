import React from 'react';

const Manifesto = () => {
  return (
    <div className="card manifesto-card">
      <h1 className="manifesto-title">MANIFESTO</h1>
      <h2 className="manifesto-subtitle">Public, but not too public.</h2>
      <div className="manifesto-content">
        <p>Wypri is a response to modern social media's obsession with permanence.</p>
        <p>No accounts, no profiles to curate, no followers to chase. Every post stands on its own merit.</p>
        <p>Nothing permanent. Posts naturally fade. Share your thoughts, feelings, photography and music knowing it won't be there forever. The scarcity makes it more valuable.</p>
        <p>Annotations become the post. Instead of separate comment threads, responses weave directly into the original content. Your post becomes a canvas for everyone who views it.</p>
      </div>
      <div className="post-footer">
        <div className="post-footer-content">
          <div>:)</div>
          <div><a href="https://theoa.me" target="_blank" rel="noreferrer">theoa.me</a></div>
        </div>
      </div>
    </div>
  );
};

export default Manifesto; 