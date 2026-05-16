/**
 * auth.js — Shared Auth Helper for The Life Navigator (NORTH)
 * Include this on every protected page with:
 * <script src="../../assets/js/auth.js"></script>
 */

const TLN = {
  // ─── Read user from localStorage ───────────────────────────────────────
  getUser() {
    return {
      userId:      localStorage.getItem('userId')      || '',
      studentName: localStorage.getItem('studentName') || 'Student',
      parentName:  localStorage.getItem('parentName')  || 'Parent',
      className:   localStorage.getItem('className')   || '',
      schoolName:  localStorage.getItem('schoolName')  || '',
      schoolURL:   localStorage.getItem('schoolURL')   || '',
      quoteUrl:    localStorage.getItem('quoteUrl')    || '',
      imageUrl2:   localStorage.getItem('imageUrl2')   || '',
      videoUrl:    localStorage.getItem('videoUrl')    || '',
      skillUrl:    localStorage.getItem('skillUrl')    || '',
      classVideoUrl: localStorage.getItem('classVideoUrl') || '',
      schoolMessage1: localStorage.getItem('schoolMessage1') || '',
      schoolMessage2: localStorage.getItem('schoolMessage2') || '',
    };
  },

  // ─── Save user data to localStorage ────────────────────────────────────
  setUser(data) {
    const map = {
      userId:         data.userId      || data['User ID'] || '',
      studentName:    data.studentName || data['Student Name'] || '',
      parentName:     data.parentName  || data['Name of Parent'] || '',
      className:      data.className   || data['Class'] || '',
      schoolName:     data.schoolName  || data['Name of School'] || '',
      schoolURL:      data.schoolImage || data['School/college Image'] || '',
      quoteUrl:       data.quoteLink   || data['Quote link'] || '',
      imageUrl2:      data.schoolImage2 || '',
      videoUrl:       data.featuredUrl || data['Video Url (parents homepage)'] || '',
      skillUrl:       data.skillUrl    || data['Vid url skilling'] || '',
      classVideoUrl:  data.classVideoUrl || data['Video url ( class)'] || '',
      schoolMessage1: data.message1    || data['message-1'] || '',
      schoolMessage2: data.message2    || data['message-2'] || '',
    };
    Object.entries(map).forEach(([k, v]) => localStorage.setItem(k, v));
  },

  // ─── Guard: redirect to login if not authenticated ─────────────────────
  requireAuth(loginUrl = '/index.html') {
    if (!localStorage.getItem('studentName') || !localStorage.getItem('userId')) {
      window.location.replace(loginUrl);
      return false;
    }
    return true;
  },

  // ─── Logout ────────────────────────────────────────────────────────────
  logout(loginUrl = '/index.html') {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      window.location.replace(loginUrl);
    }
  },

  // ─── Fill common UI fields by data-tln attribute ───────────────────────
  // Usage: <span data-tln="studentName"></span>
  fillUI() {
    const user = TLN.getUser();
    document.querySelectorAll('[data-tln]').forEach(el => {
      const key = el.getAttribute('data-tln');
      if (user[key] !== undefined) el.textContent = user[key];
    });
    // Fill images
    document.querySelectorAll('[data-tln-src]').forEach(el => {
      const key = el.getAttribute('data-tln-src');
      if (user[key]) el.src = user[key];
    });
  }
};

// Auto-fill UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => TLN.fillUI());
