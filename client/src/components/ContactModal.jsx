export default function ContactModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 500, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📧 Contact Us</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <p style={{ color: '#b3b3b3', marginBottom: 20, lineHeight: 1.6 }}>
          We'd love to hear from you!<br />
          If you have any questions, suggestions, feedback, or issues regarding Music App, feel free to contact us.
        </p>

        <div style={{ background: '#282828', borderRadius: 10, padding: '20px 24px', marginBottom: 14 }}>
          <p style={{ color: '#b3b3b3', fontSize: '0.85em', marginBottom: 4 }}>👨‍💻 Developer</p>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: '1.05em' }}>METE BHARATH</p>
        </div>

        <div style={{ background: '#282828', borderRadius: 10, padding: '20px 24px', marginBottom: 14 }}>
          <p style={{ color: '#b3b3b3', fontSize: '0.85em', marginBottom: 4 }}>📧 Email</p>
          <a href="mailto:metebharath4@gmail.com" style={{ color: 'var(--accent-color)', fontWeight: 600, fontSize: '1.05em', textDecoration: 'none', cursor: 'pointer' }}>metebharath4@gmail.com</a>
        </div>

        <p style={{ color: '#888', fontSize: '0.85em', marginTop: 10, lineHeight: 1.5 }}>
          Thank you for using Music App!<br />
          Your feedback helps us improve and provide a better music experience for everyone.
        </p>
      </div>
    </div>
  );
}
