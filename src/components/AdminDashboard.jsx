import React, { useState, useEffect } from 'react';

export default function AdminDashboard({ data, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState('settings');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  // Credentials (saved in localStorage)
  const [githubToken, setGithubToken] = useState(localStorage.getItem('ms_gh_token') || '');
  const [githubRepo, setGithubRepo] = useState(localStorage.getItem('ms_gh_repo') || ''); // format: owner/repo
  const [githubBranch, setGithubBranch] = useState(localStorage.getItem('ms_gh_branch') || 'main');
  
  // App state copies for editing
  const [settings, setSettings] = useState(JSON.parse(JSON.stringify(data.settings)));
  const [books, setBooks] = useState(JSON.parse(JSON.stringify(data.books)));
  const [characters, setCharacters] = useState(JSON.parse(JSON.stringify(data.characters)));
  const [faqs, setFaqs] = useState(JSON.parse(JSON.stringify(data.faqs)));

  // Form states for items (CRUD)
  const [editingBook, setEditingBook] = useState(null); // book object or 'new'
  const [editingChar, setEditingChar] = useState(null); // char object or 'new'
  const [editingFaq, setEditingFaq] = useState(null);   // faq object or 'new'

  // Queued file uploads in this session
  const [queuedUploads, setQueuedUploads] = useState([]);
  const [publishStatus, setPublishStatus] = useState('idle'); // idle, publishing, success, error
  const [publishLog, setPublishLog] = useState('');

  // Handle Login verification
  const handleLogin = (e) => {
    e.preventDefault();
    const systemPassword = data.settings.adminPassword || 'MayaSprings2026';
    if (passwordInput === systemPassword) {
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };


  // Persist credentials
  useEffect(() => {
    localStorage.setItem('ms_gh_token', githubToken);
    localStorage.setItem('ms_gh_repo', githubRepo);
    localStorage.setItem('ms_gh_branch', githubBranch);
  }, [githubToken, githubRepo, githubBranch]);

  // Convert File to Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Extract raw base64 (remove the data:image/png;base64, prefix)
        const base64Str = reader.result.split(',')[1];
        resolve(base64Str);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle image selection
  const handleImageUpload = async (e, onSelectPath) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      // Create a unique filename
      const extension = file.name.split('.').pop();
      const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15);
      const uniqueFilename = `${cleanName}_${Date.now()}.${extension}`;
      const relativePath = `/uploads/${uniqueFilename}`;

      // Queue the upload
      setQueuedUploads(prev => [...prev, {
        filename: uniqueFilename,
        base64: base64
      }]);

      // Set the path in the editing state (loads relative path on client)
      onSelectPath(relativePath);
      alert(`Image queued for upload: ${uniqueFilename}. Remember to Save & Publish to upload to GitHub.`);
    } catch (err) {
      console.error(err);
      alert('Error reading image file');
    }
  };

  // GitHub API Helpers
  const fetchFileSha = async (path) => {
    try {
      const url = `https://api.github.com/repos/${githubRepo}/contents/${path}?ref=${githubBranch}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      if (response.ok) {
        const json = await response.json();
        return json.sha;
      }
      return null; // File might not exist
    } catch (err) {
      console.error('Error fetching SHA:', err);
      return null;
    }
  };

  const uploadFileToGithub = async (path, contentBase64, commitMessage, existingSha = null) => {
    const url = `https://api.github.com/repos/${githubRepo}/contents/${path}`;
    const payload = {
      message: commitMessage,
      content: contentBase64,
      branch: githubBranch
    };
    if (existingSha) {
      payload.sha = existingSha;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GitHub upload failed: ${response.status} - ${errText}`);
    }
  };

  const handlePublish = async () => {
    if (!githubToken || !githubRepo) {
      alert('Please configure your GitHub settings (Token and Repository) first.');
      return;
    }

    setPublishStatus('publishing');
    setPublishLog('Starting publish process...');

    try {
      // Step 1: Upload queued images
      setPublishLog(prev => `${prev}\n1. Uploading images to GitHub...`);
      for (const upload of queuedUploads) {
        setPublishLog(prev => `${prev}\n   - Uploading public/uploads/${upload.filename}...`);
        // Images are uploaded to public/uploads/
        await uploadFileToGithub(`public/uploads/${upload.filename}`, upload.base64, `Upload image ${upload.filename} [skip ci]`);
      }

      // Step 2: Get current data.json SHA
      setPublishLog(prev => `${prev}\n2. Fetching public/data.json file status...`);
      const dataJsonSha = await fetchFileSha('public/data.json');

      // Step 3: Package final data.json
      const finalData = {
        settings,
        books,
        characters,
        faqs
      };

      const dataJsonBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(finalData, null, 2))));

      setPublishLog(prev => `${prev}\n3. Committing updated data.json to repository...`);
      await uploadFileToGithub('public/data.json', dataJsonBase64, 'Update website database via Admin Dashboard', dataJsonSha);

      setPublishStatus('success');
      setPublishLog(prev => `${prev}\n\n🎉 Success! Changes committed successfully to GitHub. Cloudflare Pages is now building your updates (takes about 1-2 minutes).`);
      setQueuedUploads([]); // Reset queue
      
      // Update parent component state
      onSave(finalData);
    } catch (err) {
      console.error(err);
      setPublishStatus('error');
      setPublishLog(prev => `${prev}\n\n❌ Error: ${err.message}`);
    }
  };

  // CRUD handlers: Books
  const saveBook = (e) => {
    e.preventDefault();
    if (editingBook === 'new') {
      const newId = editingBook.id || `book-${Date.now()}`;
      const newBookObj = { ...editingBook, id: newId };
      setBooks(prev => [...prev, newBookObj]);
    } else {
      setBooks(prev => prev.map(b => b.id === editingBook.id ? editingBook : b));
    }
    setEditingBook(null);
  };

  const deleteBook = (id) => {
    if (confirm('Are you sure you want to delete this book? This will also remove character references.')) {
      setBooks(prev => prev.filter(b => b.id !== id));
      setCharacters(prev => prev.filter(c => c.bookId !== id));
    }
  };

  // CRUD handlers: Characters
  const saveCharacter = (e) => {
    e.preventDefault();
    if (editingChar === 'new') {
      const newId = editingChar.id || `char-${Date.now()}`;
      const newCharObj = { ...editingChar, id: newId };
      setCharacters(prev => [...prev, newCharObj]);
    } else {
      setCharacters(prev => prev.map(c => c.id === editingChar.id ? editingChar : c));
    }
    setEditingChar(null);
  };

  const deleteCharacter = (id) => {
    if (confirm('Are you sure you want to delete this character?')) {
      setCharacters(prev => prev.filter(c => c.id !== id));
    }
  };

  // CRUD handlers: FAQs
  const saveFaq = (e) => {
    e.preventDefault();
    if (editingFaq === 'new') {
      const newId = editingFaq.id || `faq-${Date.now()}`;
      const newFaqObj = { ...editingFaq, id: newId };
      setFaqs(prev => [...prev, newFaqObj]);
    } else {
      setFaqs(prev => prev.map(f => f.id === editingFaq.id ? editingFaq : f));
    }
    setEditingFaq(null);
  };

  const deleteFaq = (id) => {
    if (confirm('Are you sure you want to delete this FAQ?')) {
      setFaqs(prev => prev.filter(f => f.id !== id));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-overlay">
        <div className="admin-modal" style={{ maxWidth: '400px', height: 'auto', padding: '30px' }}>
          <div className="admin-header" style={{ padding: '0 0 20px 0', background: 'none', color: 'inherit', borderBottom: '1px solid #eee' }}>
            <h2 style={{ color: 'var(--color-primary)' }}>CMS Login</h2>
            <button className="admin-close" style={{ color: '#333' }} onClick={onClose}>&times;</button>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
            <div className="admin-input-group">
              <label>Admin Password</label>
              <input 
                type="password" 
                className="admin-input"
                placeholder="Enter password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
              />
              {loginError && <small style={{ color: '#dc3545', fontWeight: 'bold', marginTop: '4px' }}>Incorrect password. Please try again.</small>}
            </div>
            <button type="submit" className="admin-btn admin-btn-add" style={{ padding: '12px', fontSize: '1rem' }}>
              🔑 Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-overlay">
      <div className="admin-modal">
        <div className="admin-header">
          <h2>Maya Springs CMS Dashboard</h2>
          <button className="admin-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="admin-body">
          {/* Sidebar Tabs */}
          <div className="admin-sidebar">
            <button 
              className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ Global Settings
            </button>
            <button 
              className={`admin-tab-btn ${activeTab === 'books' ? 'active' : ''}`}
              onClick={() => setActiveTab('books')}
            >
              📚 Manage Books
            </button>
            <button 
              className={`admin-tab-btn ${activeTab === 'characters' ? 'active' : ''}`}
              onClick={() => setActiveTab('characters')}
            >
              🦁 Characters Bio
            </button>
            <button 
              className={`admin-tab-btn ${activeTab === 'faqs' ? 'active' : ''}`}
              onClick={() => setActiveTab('faqs')}
            >
              ❓ AEO FAQs
            </button>
            <button 
              className={`admin-tab-btn ${activeTab === 'publish' ? 'active' : ''}`}
              onClick={() => setActiveTab('publish')}
            >
              🚀 Publish changes
            </button>
          </div>

          {/* Main Form Fields */}
          <div className="admin-content">
            
            {/* Tab: Settings */}
            {activeTab === 'settings' && (
              <div className="admin-pane">
                <h3>Global Website Configuration</h3>
                <div className="admin-row">
                  <div className="admin-input-group">
                    <label>Website Title</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      value={settings.title}
                      onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                    />
                  </div>
                  <div className="admin-input-group">
                    <label>Author Name</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      value={settings.author}
                      onChange={(e) => setSettings({ ...settings, author: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-row">
                  <div className="admin-input-group">
                    <label>Subtitle (English)</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      value={settings.subtitle.en}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        subtitle: { ...settings.subtitle, en: e.target.value } 
                      })}
                    />
                  </div>
                  <div className="admin-input-group">
                    <label>Subtitle (Italiano)</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      value={settings.subtitle.it}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        subtitle: { ...settings.subtitle, it: e.target.value } 
                      })}
                    />
                  </div>
                </div>

                <div className="admin-row">
                  <div className="admin-input-group">
                    <label>Author Bio (English)</label>
                    <textarea 
                      className="admin-input" 
                      rows="3"
                      value={settings.authorBio.en}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        authorBio: { ...settings.authorBio, en: e.target.value } 
                      })}
                    />
                  </div>
                  <div className="admin-input-group">
                    <label>Biografia Autore (Italiano)</label>
                    <textarea 
                      className="admin-input" 
                      rows="3"
                      value={settings.authorBio.it}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        authorBio: { ...settings.authorBio, it: e.target.value } 
                      })}
                    />
                  </div>
                </div>

                <div className="admin-row">
                  <div className="admin-input-group">
                    <label>n8n Webhook URL (Email Funnel)</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      value={settings.n8nWebhookUrl}
                      onChange={(e) => setSettings({ ...settings, n8nWebhookUrl: e.target.value })}
                    />
                  </div>
                  <div className="admin-input-group">
                    <label>Admin Password (Dashboard Security)</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      value={settings.adminPassword || 'MayaSprings2026'}
                      onChange={(e) => setSettings({ ...settings, adminPassword: e.target.value })}
                    />
                  </div>
                </div>

                <hr style={{ margin: '15px 0', border: '0', borderTop: '1px solid #ddd' }} />
                <h4>Social & Ecosystem Channels</h4>
                <div className="admin-row">
                  <div className="admin-input-group">
                    <label>YouTube Channel Link</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      value={settings.socials.youtube}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        socials: { ...settings.socials, youtube: e.target.value } 
                      })}
                    />
                  </div>
                  <div className="admin-input-group">
                    <label>Spotify Profile Link</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      value={settings.socials.spotify}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        socials: { ...settings.socials, spotify: e.target.value } 
                      })}
                    />
                  </div>
                </div>

                <div className="admin-row">
                  <div className="admin-input-group">
                    <label>Amazon Profile Link</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      value={settings.socials.amazon}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        socials: { ...settings.socials, amazon: e.target.value } 
                      })}
                    />
                  </div>
                  <div className="admin-input-group">
                    <label>Audible Link</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      value={settings.socials.audible}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        socials: { ...settings.socials, audible: e.target.value } 
                      })}
                    />
                  </div>
                </div>

                <hr style={{ margin: '15px 0', border: '0', borderTop: '1px solid #ddd' }} />
                <h4>Theme Colors</h4>
                <div className="admin-row">
                  <div className="admin-input-group">
                    <label>Primary (Buttons & Headers)</label>
                    <div className="color-picker-row">
                      <div className="color-preview">
                        <input 
                          type="color" 
                          value={settings.theme.primaryColor}
                          onChange={(e) => setSettings({ 
                            ...settings, 
                            theme: { ...settings.theme, primaryColor: e.target.value } 
                          })}
                        />
                      </div>
                      <input 
                        type="text" 
                        className="admin-input" 
                        value={settings.theme.primaryColor}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          theme: { ...settings.theme, primaryColor: e.target.value } 
                        })}
                      />
                    </div>
                  </div>

                  <div className="admin-input-group">
                    <label>Secondary (Accent Buttons / Badges)</label>
                    <div className="color-picker-row">
                      <div className="color-preview">
                        <input 
                          type="color" 
                          value={settings.theme.secondaryColor}
                          onChange={(e) => setSettings({ 
                            ...settings, 
                            theme: { ...settings.theme, secondaryColor: e.target.value } 
                          })}
                        />
                      </div>
                      <input 
                        type="text" 
                        className="admin-input" 
                        value={settings.theme.secondaryColor}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          theme: { ...settings.theme, secondaryColor: e.target.value } 
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="admin-row">
                  <div className="admin-input-group">
                    <label>Background Color</label>
                    <div className="color-picker-row">
                      <div className="color-preview">
                        <input 
                          type="color" 
                          value={settings.theme.backgroundColor}
                          onChange={(e) => setSettings({ 
                            ...settings, 
                            theme: { ...settings.theme, backgroundColor: e.target.value } 
                          })}
                        />
                      </div>
                      <input 
                        type="text" 
                        className="admin-input" 
                        value={settings.theme.backgroundColor}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          theme: { ...settings.theme, backgroundColor: e.target.value } 
                        })}
                      />
                    </div>
                  </div>

                  <div className="admin-input-group">
                    <label>Text Color</label>
                    <div className="color-picker-row">
                      <div className="color-preview">
                        <input 
                          type="color" 
                          value={settings.theme.textColor}
                          onChange={(e) => setSettings({ 
                            ...settings, 
                            theme: { ...settings.theme, textColor: e.target.value } 
                          })}
                        />
                      </div>
                      <input 
                        type="text" 
                        className="admin-input" 
                        value={settings.theme.textColor}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          theme: { ...settings.theme, textColor: e.target.value } 
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Books */}
            {activeTab === 'books' && (
              <div className="admin-pane">
                <div className="admin-list-header">
                  <h3>Manage Books Catalogue</h3>
                  {!editingBook && (
                    <button 
                      className="admin-btn admin-btn-add"
                      onClick={() => setEditingBook({
                        title: { en: '', it: '' },
                        description: { en: '', it: '' },
                        cover: '',
                        coloringCover: '',
                        links: { amazon: '', spotify: '', youtube: '', audible: '' },
                        flipbookPages: [],
                        isLatest: false,
                        isTeaser: false
                      })}
                    >
                      + Add Book
                    </button>
                  )}
                </div>

                {editingBook ? (
                  <form onSubmit={saveBook} className="admin-form-box">
                    <h4>{editingBook.id ? 'Edit Book' : 'Add New Book'}</h4>
                    
                    <div className="admin-row">
                      <div className="admin-input-group">
                        <label>Title (English)</label>
                        <input 
                          type="text" 
                          className="admin-input" 
                          required
                          value={editingBook.title.en}
                          onChange={(e) => setEditingBook({
                            ...editingBook,
                            title: { ...editingBook.title, en: e.target.value }
                          })}
                        />
                      </div>
                      <div className="admin-input-group">
                        <label>Titolo (Italiano)</label>
                        <input 
                          type="text" 
                          className="admin-input" 
                          required
                          value={editingBook.title.it}
                          onChange={(e) => setEditingBook({
                            ...editingBook,
                            title: { ...editingBook.title, it: e.target.value }
                          })}
                        />
                      </div>
                    </div>

                    <div className="admin-row">
                      <div className="admin-input-group">
                        <label>Description (English)</label>
                        <textarea 
                          className="admin-input" 
                          rows="3"
                          value={editingBook.description.en}
                          onChange={(e) => setEditingBook({
                            ...editingBook,
                            description: { ...editingBook.description, en: e.target.value }
                          })}
                        />
                      </div>
                      <div className="admin-input-group">
                        <label>Descrizione (Italiano)</label>
                        <textarea 
                          className="admin-input" 
                          rows="3"
                          value={editingBook.description.it}
                          onChange={(e) => setEditingBook({
                            ...editingBook,
                            description: { ...editingBook.description, it: e.target.value }
                          })}
                        />
                      </div>
                    </div>

                    <div className="admin-row">
                      <div className="admin-input-group">
                        <label>Book Cover Image</label>
                        <input 
                          type="text" 
                          className="admin-input" 
                          placeholder="Image URL or upload below"
                          value={editingBook.cover}
                          onChange={(e) => setEditingBook({ ...editingBook, cover: e.target.value })}
                        />
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, (path) => setEditingBook({ ...editingBook, cover: path }))}
                        />
                      </div>
                      <div className="admin-input-group">
                        <label>Coloring Book Cover (Optional)</label>
                        <input 
                          type="text" 
                          className="admin-input" 
                          placeholder="Image URL or upload below"
                          value={editingBook.coloringCover}
                          onChange={(e) => setEditingBook({ ...editingBook, coloringCover: e.target.value })}
                        />
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, (path) => setEditingBook({ ...editingBook, coloringCover: path }))}
                        />
                      </div>
                    </div>

                    <div className="admin-row">
                      <div className="admin-input-group" style={{ flexDirection: 'row', gap: '20px', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="checkbox" 
                            checked={editingBook.isLatest}
                            onChange={(e) => setEditingBook({ ...editingBook, isLatest: e.target.checked, isTeaser: e.target.checked ? false : editingBook.isTeaser })}
                          />
                          Is Latest / Featured Book
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="checkbox" 
                            checked={editingBook.isTeaser}
                            onChange={(e) => setEditingBook({ ...editingBook, isTeaser: e.target.checked, isLatest: e.target.checked ? false : editingBook.isLatest })}
                          />
                          Is Teaser (Coming Soon)
                        </label>
                      </div>
                    </div>

                    {!editingBook.isTeaser && (
                      <>
                        <hr style={{ border: '0', borderTop: '1px solid #eee' }} />
                        <h5>Ecosystem Links</h5>
                        <div className="admin-row">
                          <div className="admin-input-group">
                            <label>Amazon Book Link</label>
                            <input 
                              type="text" 
                              className="admin-input" 
                              value={editingBook.links.amazon}
                              onChange={(e) => setEditingBook({
                                ...editingBook,
                                links: { ...editingBook.links, amazon: e.target.value }
                              })}
                            />
                          </div>
                          <div className="admin-input-group">
                            <label>Spotify Playlist Link</label>
                            <input 
                              type="text" 
                              className="admin-input" 
                              value={editingBook.links.spotify}
                              onChange={(e) => setEditingBook({
                                ...editingBook,
                                links: { ...editingBook.links, spotify: e.target.value }
                              })}
                            />
                          </div>
                        </div>

                        <div className="admin-row">
                          <div className="admin-input-group">
                            <label>YouTube Story Link</label>
                            <input 
                              type="text" 
                              className="admin-input" 
                              value={editingBook.links.youtube}
                              onChange={(e) => setEditingBook({
                                ...editingBook,
                                links: { ...editingBook.links, youtube: e.target.value }
                              })}
                            />
                          </div>
                          <div className="admin-input-group">
                            <label>Audible Audiobook Link</label>
                            <input 
                              type="text" 
                              className="admin-input" 
                              value={editingBook.links.audible}
                              onChange={(e) => setEditingBook({
                                ...editingBook,
                                links: { ...editingBook.links, audible: e.target.value }
                              })}
                            />
                          </div>
                        </div>

                        <hr style={{ border: '0', borderTop: '1px solid #eee' }} />
                        <h5>Flipbook Preview Pages</h5>
                        <div className="admin-input-group">
                          <label>Queue Flipbook Page Image</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, (path) => {
                              setEditingBook({
                                ...editingBook,
                                flipbookPages: [...editingBook.flipbookPages, path]
                              });
                            })}
                          />
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                            {editingBook.flipbookPages.map((p, idx) => (
                              <div key={idx} style={{ position: 'relative' }}>
                                <img src={p} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                                <button 
                                  type="button" 
                                  onClick={() => setEditingBook({
                                    ...editingBook,
                                    flipbookPages: editingBook.flipbookPages.filter((_, i) => i !== idx)
                                  })}
                                  style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#f00', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                      <button type="submit" className="admin-btn admin-btn-add">Save Book</button>
                      <button type="button" className="admin-btn btn-secondary" onClick={() => setEditingBook(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="admin-card-list">
                    {books.map(b => (
                      <div key={b.id} className="admin-list-item">
                        <div className="admin-list-item-info">
                          <img src={b.cover} alt="" className="admin-list-thumb" />
                          <div>
                            <strong>{b.title.en}</strong>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                              {b.isLatest ? '⭐ Latest' : b.isTeaser ? '⌛ Teaser' : 'Standard'}
                            </div>
                          </div>
                        </div>
                        <div className="admin-item-actions">
                          <button className="admin-btn admin-btn-edit" onClick={() => setEditingBook(b)}>Edit</button>
                          <button className="admin-btn admin-btn-delete" onClick={() => deleteBook(b.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Characters */}
            {activeTab === 'characters' && (
              <div className="admin-pane">
                <div className="admin-list-header">
                  <h3>Manage Character Bios</h3>
                  {!editingChar && (
                    <button 
                      className="admin-btn admin-btn-add"
                      onClick={() => setEditingChar({
                        bookId: books.length > 0 ? books[0].id : '',
                        name: '',
                        image: '',
                        bio: { en: '', it: '' }
                      })}
                    >
                      + Add Character
                    </button>
                  )}
                </div>

                {editingChar ? (
                  <form onSubmit={saveCharacter} className="admin-form-box">
                    <h4>{editingChar.id ? 'Edit Character' : 'Add New Character'}</h4>
                    
                    <div className="admin-row">
                      <div className="admin-input-group">
                        <label>Character Name</label>
                        <input 
                          type="text" 
                          className="admin-input" 
                          required
                          value={editingChar.name}
                          onChange={(e) => setEditingChar({ ...editingChar, name: e.target.value })}
                        />
                      </div>
                      <div className="admin-input-group">
                        <label>Associate to Book</label>
                        <select 
                          className="admin-input"
                          value={editingChar.bookId}
                          onChange={(e) => setEditingChar({ ...editingChar, bookId: e.target.value })}
                        >
                          {books.map(b => (
                            <option key={b.id} value={b.id}>{b.title.en}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="admin-row">
                      <div className="admin-input-group">
                        <label>Biography (English)</label>
                        <textarea 
                          className="admin-input" 
                          rows="3"
                          required
                          value={editingChar.bio.en}
                          onChange={(e) => setEditingChar({
                            ...editingChar,
                            bio: { ...editingChar.bio, en: e.target.value }
                          })}
                        />
                      </div>
                      <div className="admin-input-group">
                        <label>Biografia (Italiano)</label>
                        <textarea 
                          className="admin-input" 
                          rows="3"
                          required
                          value={editingChar.bio.it}
                          onChange={(e) => setEditingChar({
                            ...editingChar,
                            bio: { ...editingChar.bio, it: e.target.value }
                          })}
                        />
                      </div>
                    </div>

                    <div className="admin-input-group">
                      <label>Character Image</label>
                      <input 
                        type="text" 
                        className="admin-input" 
                        placeholder="Image URL or upload below"
                        value={editingChar.image}
                        onChange={(e) => setEditingChar({ ...editingChar, image: e.target.value })}
                      />
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, (path) => setEditingChar({ ...editingChar, image: path }))}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                      <button type="submit" className="admin-btn admin-btn-add">Save Character</button>
                      <button type="button" className="admin-btn btn-secondary" onClick={() => setEditingChar(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="admin-card-list">
                    {characters.map(c => {
                      const associatedBook = books.find(b => b.id === c.bookId);
                      return (
                        <div key={c.id} className="admin-list-item">
                          <div className="admin-list-item-info">
                            <img src={c.image} alt="" className="admin-list-thumb" />
                            <div>
                              <strong>{c.name}</strong>
                              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                                Book: {associatedBook ? associatedBook.title.en : 'Unassigned'}
                              </div>
                            </div>
                          </div>
                          <div className="admin-item-actions">
                            <button className="admin-btn admin-btn-edit" onClick={() => setEditingChar(c)}>Edit</button>
                            <button className="admin-btn admin-btn-delete" onClick={() => deleteCharacter(c.id)}>Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: FAQs */}
            {activeTab === 'faqs' && (
              <div className="admin-pane">
                <div className="admin-list-header">
                  <h3>Manage Bilingual AEO FAQs</h3>
                  {!editingFaq && (
                    <button 
                      className="admin-btn admin-btn-add"
                      onClick={() => setEditingFaq({
                        question: { en: '', it: '' },
                        answer: { en: '', it: '' }
                      })}
                    >
                      + Add FAQ
                    </button>
                  )}
                </div>

                {editingFaq ? (
                  <form onSubmit={saveFaq} className="admin-form-box">
                    <h4>{editingFaq.id ? 'Edit FAQ' : 'Add New FAQ'}</h4>
                    
                    <div className="admin-row">
                      <div className="admin-input-group">
                        <label>Question (English)</label>
                        <input 
                          type="text" 
                          className="admin-input" 
                          required
                          value={editingFaq.question.en}
                          onChange={(e) => setEditingFaq({
                            ...editingFaq,
                            question: { ...editingFaq.question, en: e.target.value }
                          })}
                        />
                      </div>
                      <div className="admin-input-group">
                        <label>Domanda (Italiano)</label>
                        <input 
                          type="text" 
                          className="admin-input" 
                          required
                          value={editingFaq.question.it}
                          onChange={(e) => setEditingFaq({
                            ...editingFaq,
                            question: { ...editingFaq.question, it: e.target.value }
                          })}
                        />
                      </div>
                    </div>

                    <div className="admin-row">
                      <div className="admin-input-group">
                        <label>Answer (English)</label>
                        <textarea 
                          className="admin-input" 
                          rows="4"
                          required
                          value={editingFaq.answer.en}
                          onChange={(e) => setEditingFaq({
                            ...editingFaq,
                            answer: { ...editingFaq.answer, en: e.target.value }
                          })}
                        />
                      </div>
                      <div className="admin-input-group">
                        <label>Risposta (Italiano)</label>
                        <textarea 
                          className="admin-input" 
                          rows="4"
                          required
                          value={editingFaq.answer.it}
                          onChange={(e) => setEditingFaq({
                            ...editingFaq,
                            answer: { ...editingFaq.answer, it: e.target.value }
                          })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                      <button type="submit" className="admin-btn admin-btn-add">Save FAQ</button>
                      <button type="button" className="admin-btn btn-secondary" onClick={() => setEditingFaq(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="admin-card-list">
                    {faqs.map(f => (
                      <div key={f.id} className="admin-list-item">
                        <div style={{ flexGrow: 1, paddingRight: '15px' }}>
                          <strong>{f.question.en}</strong>
                          <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' }}>
                            {f.answer.en}
                          </p>
                        </div>
                        <div className="admin-item-actions" style={{ flexShrink: 0 }}>
                          <button className="admin-btn admin-btn-edit" onClick={() => setEditingFaq(f)}>Edit</button>
                          <button className="admin-btn admin-btn-delete" onClick={() => deleteFaq(f.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Publish */}
            {activeTab === 'publish' && (
              <div className="admin-pane">
                <h3>Publish Changes to Live Site</h3>
                <p style={{ opacity: 0.8 }}>
                  Saving commits the new settings, colors, books, characters, and uploaded images directly to your GitHub repository. Cloudflare Pages automatically detects the commit and redeploys the live site.
                </p>

                <div className="admin-row">
                  <div className="admin-input-group">
                    <label>GitHub Repository (owner/repo)</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      placeholder="e.g. cataw/magic-storyworld"
                      value={githubRepo}
                      onChange={(e) => setGithubRepo(e.target.value)}
                    />
                  </div>
                  <div className="admin-input-group">
                    <label>Target Branch</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      value={githubBranch}
                      onChange={(e) => setGithubBranch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-input-group">
                  <label>GitHub Personal Access Token (PAT)</label>
                  <input 
                    type="password" 
                    className="admin-input" 
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                  />
                  <small style={{ opacity: 0.6 }}>
                    This token is stored only in your local browser storage and is sent directly to the GitHub API. It never touches any other server.
                  </small>
                </div>

                {queuedUploads.length > 0 && (
                  <div style={{ background: '#fff9db', border: '1px solid #ffe066', padding: '12px', borderRadius: '4px', fontSize: '0.9rem' }}>
                    ⚠️ You have <strong>{queuedUploads.length}</strong> new image file(s) queued for upload. Saving will upload these to your repository.
                  </div>
                )}

                <div style={{ marginTop: '10px' }}>
                  <button 
                    type="button" 
                    className="admin-btn admin-btn-add" 
                    style={{ fontSize: '1.1rem', padding: '12px 24px' }}
                    onClick={handlePublish}
                    disabled={publishStatus === 'publishing'}
                  >
                    {publishStatus === 'publishing' ? 'Saving & Publishing...' : '🚀 Save & Publish Changes'}
                  </button>
                </div>

                {publishStatus !== 'idle' && (
                  <pre style={{ 
                    background: '#1e1e1e', 
                    color: '#a9b7c6', 
                    padding: '20px', 
                    borderRadius: '8px', 
                    fontFamily: 'monospace', 
                    fontSize: '0.85rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {publishLog}
                  </pre>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
