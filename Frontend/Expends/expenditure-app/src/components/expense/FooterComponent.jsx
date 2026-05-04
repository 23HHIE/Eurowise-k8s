function FooterComponent() {
    return (
        <footer className="footer"  >
            <div className="container mt-3">
                <div className="row">
                    <div className="col-md-6">
                        <h2 style={{ fontWeight: '100' }}>Help Center</h2>
                        <p  >Email: Alpha@eurowise.com</p>
                    </div>
                    <div className="col-md-6 text-md-end">
                        <div style={{ width: '580px', textAlign: 'right' }}>
                            <p>Follow us:</p>
                        </div>

                        <div className="social-logo">
                            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="me-3">
                                <img src="/images/ins.logo.png" alt="Instagram" width="30" height="30" />
                            </a>
                            <a href="https://www.meta.com" target="_blank" rel="noopener noreferrer" className="me-3" >
                                <img src="/images/facebook-logo.png" alt="Meta" width="30" height="30" />
                            </a>
                            <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" >
                                <img src="/images/tiktok-logo.png" alt="TikTok" width="30" height="30" />
                            </a>
                        </div>

                    </div>
                </div>
            </div>
        </footer>
    )
}


export default FooterComponent