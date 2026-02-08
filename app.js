// ============================================
// MATTY MULTIMEDIA - ENHANCED BOOKING SYSTEM
// Complete package details + Copyable MoMo
// ============================================

console.log('🚀 Enhanced Application starting...');

// ============================================
// GLOBAL STATE
// ============================================
const STATE = {
  currentUser: null,
  currentStep: 1,
  selectedPackage: null,
  selectedDate: null,
  selectedStartTime: null,
  selectedEndTime: null,
  bookingData: {},
  packages: [],
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  isMobile: window.innerWidth < 768,
  heldSlotId: null,
  holdExpiresAt: null,
  holdTimer: null,
  guestToken: null
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const Utils = {
  showToast(message, type = 'info') {
    console.log(`[Toast ${type}]:`, message);
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s reverse';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
    
    toast.addEventListener('click', () => {
      toast.style.animation = 'slideInRight 0.3s reverse';
      setTimeout(() => toast.remove(), 300);
    });
  },

  formatCurrency(amount) {
    return `GH₵ ${parseFloat(amount).toLocaleString('en-GH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  },

  formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  },

  formatTime(time) {
    if (!time) return '-';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  },

  calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return null;
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    const diffMinutes = endMinutes - startMinutes;
    
    if (diffMinutes <= 0) return null;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return { hours, minutes, totalMinutes: diffMinutes };
  },

  setButtonLoading(button, loading) {
    if (loading) {
      button.classList.add('loading');
      button.disabled = true;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
    }
  },

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.classList.add('no-scroll');
    }
  },

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.classList.remove('no-scroll');
    }
  },

  showBookingFlow() {
    const bookingFlow = document.getElementById('bookingFlow');
    if (bookingFlow) {
      bookingFlow.classList.add('active');
      document.body.classList.add('no-scroll');
    }
  },

  hideBookingFlow() {
    const bookingFlow = document.getElementById('bookingFlow');
    if (bookingFlow) {
      bookingFlow.classList.remove('active');
      document.body.classList.remove('no-scroll');
    }
  },

  showSuccessScreen() {
    const successScreen = document.getElementById('successScreen');
    if (successScreen) {
      successScreen.classList.add('active');
      document.body.classList.add('no-scroll');
    }
  },

  hideSuccessScreen() {
    const successScreen = document.getElementById('successScreen');
    if (successScreen) {
      successScreen.classList.remove('active');
      document.body.classList.remove('no-scroll');
    }
  },

  updateMobileState() {
    STATE.isMobile = window.innerWidth < 768;
  },

  generateGuestToken() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  // NEW: Copy to clipboard with feedback
  async copyToClipboard(text, label = 'Text') {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast(`${label} copied to clipboard! ✓`, 'success');
      return true;
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        this.showToast(`${label} copied to clipboard! ✓`, 'success');
        return true;
      } catch (err2) {
        this.showToast('Failed to copy. Please copy manually.', 'error');
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  }
};

// ============================================
// MOBILE NAVIGATION
// ============================================
const MobileNav = {
  init() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    const mobileNavClose = document.getElementById('mobileNavClose');
    const navLinks = mobileNav?.querySelectorAll('.mobile-nav-link');
    
    if (!menuBtn || !mobileNav) return;
    
    menuBtn.addEventListener('click', () => {
      menuBtn.classList.toggle('active');
      mobileNav.classList.toggle('active');
      document.body.classList.toggle('no-scroll', menuBtn.classList.contains('active'));
    });

    mobileNavClose?.addEventListener('click', () => {
      menuBtn.classList.remove('active');
      mobileNav.classList.remove('active');
      document.body.classList.remove('no-scroll');
    });
    
    navLinks?.forEach(link => {
      link.addEventListener('click', () => {
        menuBtn.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.classList.remove('no-scroll');
      });
    });
  }
};

// ============================================
// AUTHENTICATION MODULE (keeping existing code)
// ============================================
const Auth = {
  async init() {
    console.log('🔐 Initializing authentication...');
    
    if (!window.supabaseClient) {
      console.error('❌ Supabase client not available');
      Utils.showToast('Database connection error. Check config.js', 'error');
      return;
    }

    try {
      const { data: { session }, error } = await window.supabaseClient.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
      } else if (session) {
        console.log('✅ User already logged in:', session.user.email);
        this.handleAuthStateChange(session);
      }

      window.supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        this.handleAuthStateChange(session);
      });

      this.setupAuthForms();
      
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  },

  handleAuthStateChange(session) {
    if (session) {
      STATE.currentUser = session.user;
      this.updateUIForAuthenticatedUser();
    } else {
      STATE.currentUser = null;
      this.updateUIForGuestUser();
      if (!STATE.guestToken) {
        STATE.guestToken = Utils.generateGuestToken();
      }
    }
  },

  updateUIForAuthenticatedUser() {},

  updateUIForGuestUser() {
    const dashboard = document.getElementById('dashboard');
    if (dashboard && !dashboard.classList.contains('hidden')) {
      dashboard.classList.add('hidden');
      document.getElementById('packages')?.classList.remove('hidden');
    }
  },

  setupAuthForms() {
    document.getElementById('signInFormElement')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSignIn();
    });

    document.getElementById('signUpFormElement')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSignUp();
    });

    document.getElementById('resetPasswordFormElement')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handlePasswordReset();
    });

    document.getElementById('googleSignInBtn')?.addEventListener('click', () => this.handleGoogleAuth());
    document.getElementById('googleSignUpBtn')?.addEventListener('click', () => this.handleGoogleAuth());

    document.getElementById('showSignUp')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchForm('signUpForm');
    });

    document.getElementById('showSignIn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchForm('signInForm');
    });

    document.getElementById('forgotPasswordLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchForm('resetPasswordForm');
    });

    document.getElementById('backToSignIn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchForm('signInForm');
    });
  },

  switchForm(formId) {
    document.querySelectorAll('.auth-form').forEach(form => {
      form.classList.remove('active');
    });
    document.getElementById(formId)?.classList.add('active');
  },

  async handleSignIn() {
    const email = document.getElementById('signInEmail').value;
    const password = document.getElementById('signInPassword').value;
    const btn = document.querySelector('#signInFormElement button[type="submit"]');

    Utils.setButtonLoading(btn, true);

    try {
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      Utils.showToast('Signed in successfully!', 'success');
      Utils.hideModal('authModal');
      document.getElementById('signInFormElement').reset();

      const pendingPackage = sessionStorage.getItem('pendingBookingPackage');
      if (pendingPackage) {
        sessionStorage.removeItem('pendingBookingPackage');
        Packages.startBooking(pendingPackage);
      }

    } catch (error) {
      console.error('Sign in error:', error);
      Utils.showToast(error.message || 'Failed to sign in', 'error');
    } finally {
      Utils.setButtonLoading(btn, false);
    }
  },

  async handleSignUp() {
    const name = document.getElementById('signUpName').value;
    const email = document.getElementById('signUpEmail').value;
    const phone = document.getElementById('signUpPhone').value;
    const password = document.getElementById('signUpPassword').value;
    const termsAgreed = document.getElementById('termsCheckbox').checked;
    const btn = document.querySelector('#signUpFormElement button[type="submit"]');

    if (!termsAgreed) {
      Utils.showToast('Please accept the terms and conditions', 'warning');
      return;
    }

    Utils.setButtonLoading(btn, true);

    try {
      const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone,
          }
        }
      });

      if (authError) throw authError;

      try {
        await window.supabaseClient
          .from('users')
          .insert({
            id: authData.user.id,
            email: email,
            full_name: name,
            display_name: name.split(' ')[0],
            phone: phone
          });
      } catch (profileErr) {
        console.warn('Profile creation warning:', profileErr);
      }

      Utils.showToast('Account created! Check your email to verify.', 'success');
      Utils.hideModal('authModal');
      document.getElementById('signUpFormElement').reset();

    } catch (error) {
      console.error('Sign up error:', error);
      Utils.showToast(error.message || 'Failed to create account', 'error');
    } finally {
      Utils.setButtonLoading(btn, false);
    }
  },

  async handlePasswordReset() {
    const email = document.getElementById('resetEmail').value;
    const btn = document.querySelector('#resetPasswordFormElement button[type="submit"]');

    Utils.setButtonLoading(btn, true);

    try {
      const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      Utils.showToast('Password reset email sent!', 'success');
      this.switchForm('signInForm');
      document.getElementById('resetPasswordFormElement').reset();

    } catch (error) {
      Utils.showToast(error.message || 'Failed to send reset email', 'error');
    } finally {
      Utils.setButtonLoading(btn, false);
    }
  },

  async handleGoogleAuth() {
    try {
      const { error } = await window.supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });

      if (error) throw error;

    } catch (error) {
      Utils.showToast(error.message || 'Failed to sign in with Google', 'error');
    }
  },

  async signOut() {
    try {
      const { error } = await window.supabaseClient.auth.signOut();
      if (error) throw error;

      Utils.showToast('Signed out successfully', 'success');
      window.location.reload();

    } catch (error) {
      Utils.showToast(error.message || 'Failed to sign out', 'error');
    }
  }
};

// ============================================
// PACKAGES MODULE - ENHANCED
// ============================================
const Packages = {
  async init() {
    console.log('📦 Initializing Packages module...');
    await this.loadPackages();
    this.setupFilters();
  },

  async loadPackages() {
    console.log('📦 Loading packages from database...');
    
    if (!window.supabaseClient) {
      console.error('❌ Supabase client not available');
      Utils.showToast('Database connection error', 'error');
      return;
    }

    try {
      let { data, error } = await window.supabaseClient.rpc('get_active_packages');

      if (error) {
        console.warn('RPC failed, trying direct query:', error);
        const result = await window.supabaseClient
          .from('packages')
          .select(`
            *,
            time_slots:package_time_slots(*)
          `)
          .eq('status', 'active')
          .in('availability_status', ['available', 'limited']);
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error loading packages:', error);
        Utils.showToast('Failed to load packages', 'error');
        return;
      }

      console.log('✅ Packages loaded:', data);
      STATE.packages = data || [];
      this.displayPackages(STATE.packages);
      
    } catch (error) {
      console.error('Exception loading packages:', error);
      Utils.showToast('Error loading packages', 'error');
    }
  },

  async getPackageById(packageId) {
    console.log('📦 Loading package details:', packageId);
    
    try {
      let { data, error } = await window.supabaseClient.rpc('get_package_by_id', { 
        package_id: packageId 
      });

      if (error) {
        console.warn('RPC failed, using direct query');
        const result = await window.supabaseClient
          .from('packages')
          .select(`
            *,
            time_slots:package_time_slots(*)
          `)
          .eq('id', packageId)
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error loading package:', error);
        return null;
      }

      console.log('✅ Package loaded:', data);
      return data;
      
    } catch (error) {
      console.error('Exception loading package:', error);
      return null;
    }
  },

  displayPackages(packages) {
    console.log('🎨 Displaying packages:', packages.length);
    
    const packagesGrid = document.getElementById('packagesGrid');
    if (!packagesGrid) {
      console.error('Packages grid not found');
      return;
    }

    if (!packages || packages.length === 0) {
      packagesGrid.innerHTML = `
        <div class="no-packages">
          <i class="fas fa-box-open"></i>
          <p>No packages available at the moment</p>
        </div>
      `;
      return;
    }

    packagesGrid.innerHTML = packages.map(pkg => this.createPackageCard(pkg)).join('');
    this.attachBookingHandlers();
  },

  createPackageCard(pkg) {
    let imageUrl = 'images/default-package.jpg';
    
    if (pkg.image_path && window.supabaseClient) {
      try {
        const { data } = window.supabaseClient.storage
          .from('package-images')
          .getPublicUrl(pkg.image_path);
        
        if (data && data.publicUrl) {
          imageUrl = data.publicUrl;
        }
      } catch (e) {
        console.warn('Could not load image from storage:', e);
      }
    }

    let features = [];
    try {
      if (typeof pkg.features === 'string') {
        features = JSON.parse(pkg.features);
      } else if (Array.isArray(pkg.features)) {
        features = pkg.features;
      }
    } catch (e) {
      console.warn('Could not parse features:', e);
    }

    const price = Utils.formatCurrency(pkg.price || 0);
    const availabilityBadge = this.getAvailabilityBadge(pkg.availability_status || 'available');

    const timeSlots = pkg.time_slots || pkg.package_time_slots || [];
    const availableSlots = timeSlots.filter(slot => slot.is_available);
    const timeSlotsInfo = availableSlots.length > 0
      ? `${availableSlots.length} slots available`
      : 'Contact for availability';

    return `
      <div class="package-card" data-category="${pkg.category || 'all'}" data-package-id="${pkg.id}">
        <div class="package-image">
          <img src="${imageUrl}" alt="${pkg.name}" loading="lazy" onerror="this.src='images/default-package.jpg'">
          ${availabilityBadge}
        </div>
        <div class="package-content">
          <h3 class="package-title">${pkg.name}</h3>
          <p class="package-description">${pkg.description || ''}</p>
          
          ${pkg.subtitle ? `<p class="package-subtitle">${pkg.subtitle}</p>` : ''}
          
          ${features.length > 0 ? `
            <div class="package-features">
              ${features.slice(0, 4).map(feature => `
                <div class="feature-item">
                  <i class="fas fa-check-circle"></i>
                  <span>${feature}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <div class="package-meta">
            <div class="package-duration">
              <i class="fas fa-clock"></i>
              <span>${pkg.duration || 'Flexible duration'}</span>
            </div>
            <div class="package-slots">
              <i class="fas fa-calendar-check"></i>
              <span>${timeSlotsInfo}</span>
            </div>
          </div>
          
          <div class="package-footer">
            <div class="package-price">
              <span class="price-label">Starting from</span>
              <span class="price-amount">${price}</span>
            </div>
            <button class="btn btn-primary book-btn" 
                    data-package-id="${pkg.id}"
                    ${pkg.availability_status === 'unavailable' ? 'disabled' : ''}>
              ${pkg.availability_status === 'unavailable' ? 'Unavailable' : 'Book Now'}
            </button>
          </div>
          
          ${pkg.promotion_text ? `
            <div class="package-promotion">
              <i class="fas fa-tag"></i>
              <span>${pkg.promotion_text}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  getAvailabilityBadge(status) {
    const badges = {
      'available': '<span class="availability-badge available"><i class="fas fa-check"></i> Available</span>',
      'limited': '<span class="availability-badge limited"><i class="fas fa-exclamation"></i> Limited Slots</span>',
      'unavailable': '<span class="availability-badge unavailable"><i class="fas fa-times"></i> Unavailable</span>'
    };
    return badges[status] || badges['available'];
  },

  attachBookingHandlers() {
    const bookButtons = document.querySelectorAll('.book-btn');
    bookButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const packageId = e.target.getAttribute('data-package-id');
        await this.startBooking(packageId);
      });
    });
  },

  async startBooking(packageId) {
    console.log('🎯 Starting booking for package:', packageId);
    
    const packageDetails = await this.getPackageById(packageId);
    
    if (!packageDetails) {
      Utils.showToast('Package not found', 'error');
      return;
    }

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    
    if (!session) {
      Utils.showToast('Please sign in to book a package', 'warning');
      Utils.showModal('authModal');
      sessionStorage.setItem('pendingBookingPackage', packageId);
      return;
    }

    STATE.selectedPackage = packageDetails;
    Utils.showBookingFlow();
    BookingFlow.initializeBookingFlow(packageDetails);
  },

  setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.getAttribute('data-category');
        this.filterByCategory(category);
      });
    });
  },

  filterByCategory(category) {
    console.log('🔍 Filtering by category:', category);
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-category="${category}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
    
    if (category === 'all') {
      this.displayPackages(STATE.packages);
    } else {
      const filtered = STATE.packages.filter(pkg => pkg.category === category);
      this.displayPackages(filtered);
    }
  }
};

// ============================================
// BOOKING FLOW MODULE - ENHANCED
// ============================================
const BookingFlow = {
  init() {
    console.log('📝 Initializing booking flow...');
    this.setupStepNavigation();
    this.setupBookingForms();
    this.setupFlowClose();
  },

  setupFlowClose() {
    document.getElementById('bookingFlowClose')?.addEventListener('click', () => {
      if (STATE.heldSlotId) {
        TimeSlots.releaseTimeSlotHold();
      }
      Utils.hideBookingFlow();
      this.resetBookingFlow();
    });
  },

  setupStepNavigation() {
    const prevBtn = document.getElementById('prevStepBtn');
    const nextBtn = document.getElementById('nextStepBtn');
    const submitBtn = document.getElementById('submitBookingBtn');

    prevBtn?.addEventListener('click', () => this.previousStep());
    nextBtn?.addEventListener('click', () => this.nextStep());
    submitBtn?.addEventListener('click', () => this.submitBooking());
  },

  setupBookingForms() {
    const fileInput = document.getElementById('paymentProof');
    const filePreview = document.getElementById('filePreview');

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        filePreview.classList.add('active');
        
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            filePreview.innerHTML = `
              <img src="${e.target.result}" alt="Payment proof" />
              <p style="margin-top: 10px; font-size: 14px;">${file.name}</p>
            `;
          };
          reader.readAsDataURL(file);
        } else {
          filePreview.innerHTML = `<p>${file.name}</p>`;
        }
      }
    });

    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const timeInfo = document.getElementById('timeInfo');

    const validateTime = () => {
      const startTime = startTimeInput.value;
      const endTime = endTimeInput.value;

      if (startTime && endTime) {
        const duration = Utils.calculateDuration(startTime, endTime);
        
        if (!duration) {
          timeInfo.className = 'time-info error';
          timeInfo.textContent = 'End time must be after start time';
          STATE.selectedStartTime = null;
          STATE.selectedEndTime = null;
        } else {
          timeInfo.className = 'time-info success';
          timeInfo.textContent = `Duration: ${duration.hours}h ${duration.minutes}m`;
          STATE.selectedStartTime = startTime;
          STATE.selectedEndTime = endTime;
        }
      } else {
        timeInfo.className = 'time-info';
        timeInfo.textContent = 'Please select both start and end times';
      }
    };

    startTimeInput?.addEventListener('change', validateTime);
    endTimeInput?.addEventListener('change', validateTime);

    document.getElementById('showTermsFromBooking')?.addEventListener('click', (e) => {
      e.preventDefault();
      Utils.showModal('termsModal');
    });
  },

  initializeBookingFlow(packageDetails) {
    console.log('🎬 Initializing booking flow for:', packageDetails.name);
    
    STATE.selectedPackage = packageDetails;
    STATE.currentStep = 1;
    
    this.displaySelectedPackageInStep1(packageDetails);
    this.updateStepUI();
  },

  // ENHANCED: Display ALL package details from database
  displaySelectedPackageInStep1(pkg) {
    const step1Container = document.getElementById('bookingStep1');
    if (!step1Container) return;

    // Get image URL
    let imageUrl = 'images/default-package.jpg';
    if (pkg.image_path && window.supabaseClient) {
      try {
        const { data } = window.supabaseClient.storage
          .from('package-images')
          .getPublicUrl(pkg.image_path);
        
        if (data && data.publicUrl) {
          imageUrl = data.publicUrl;
        }
      } catch (e) {
        console.warn('Could not load image:', e);
      }
    }

    // Parse features - SHOW ALL
    let features = [];
    try {
      if (typeof pkg.features === 'string') {
        features = JSON.parse(pkg.features);
      } else if (Array.isArray(pkg.features)) {
        features = pkg.features;
      }
    } catch (e) {
      console.warn('Could not parse features:', e);
    }

    const price = Utils.formatCurrency(pkg.price || 0);
    const deposit = Utils.formatCurrency(pkg.deposit_amount || (pkg.price * 0.3));

    // Create comprehensive display with ALL database fields
    step1Container.innerHTML = `
      <h2 class="step-title">Your Selected Package</h2>
      
      <div class="selected-package-display">
        <div class="selected-package-card">
          <div class="selected-package-header">
            <div class="selected-package-image">
              <img src="${imageUrl}" alt="${pkg.name}" onerror="this.src='images/default-package.jpg'" />
              <div class="selected-badge">
                <i class="fas fa-check-circle"></i>
                <span>Selected</span>
              </div>
            </div>
          </div>
          
          <div class="selected-package-content">
            <div class="selected-package-title-section">
              <h3 class="selected-package-name">${pkg.name}</h3>
              ${pkg.subtitle ? `<p class="selected-package-subtitle">${pkg.subtitle}</p>` : ''}
              ${pkg.category ? `<span class="package-category-badge">${pkg.category}</span>` : ''}
            </div>
            
            <div class="package-description-full">
              <h4><i class="fas fa-info-circle"></i> Description</h4>
              <p>${pkg.description || 'Professional photography services tailored to your needs.'}</p>
            </div>
            
            ${features.length > 0 ? `
              <div class="selected-package-features">
                <h4 class="features-title">
                  <i class="fas fa-star"></i>
                  What's Included
                </h4>
                <div class="features-grid">
                  ${features.map(feature => `
                    <div class="feature-item-selected">
                      <i class="fas fa-check"></i>
                      <span>${feature}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            
            ${pkg.package_includes ? `
              <div class="package-includes-section">
                <h4><i class="fas fa-box"></i> Package Includes</h4>
                <p>${pkg.package_includes}</p>
              </div>
            ` : ''}
            
            ${pkg.terms_and_conditions ? `
              <div class="package-terms-preview">
                <h4><i class="fas fa-file-contract"></i> Terms & Conditions</h4>
                <p>${pkg.terms_and_conditions.substring(0, 200)}${pkg.terms_and_conditions.length > 200 ? '...' : ''}</p>
              </div>
            ` : ''}
            
            <div class="selected-package-meta">
              <div class="meta-item">
                <i class="fas fa-clock"></i>
                <div>
                  <span class="meta-label">Duration</span>
                  <span class="meta-value">${pkg.duration || 'Flexible'}</span>
                </div>
              </div>
              <div class="meta-item">
                <i class="fas fa-camera"></i>
                <div>
                  <span class="meta-label">Category</span>
                  <span class="meta-value">${pkg.category || 'Photography'}</span>
                </div>
              </div>
              ${pkg.max_people ? `
                <div class="meta-item">
                  <i class="fas fa-users"></i>
                  <div>
                    <span class="meta-label">Max People</span>
                    <span class="meta-value">${pkg.max_people}</span>
                  </div>
                </div>
              ` : ''}
              ${pkg.delivery_time ? `
                <div class="meta-item">
                  <i class="fas fa-shipping-fast"></i>
                  <div>
                    <span class="meta-label">Delivery Time</span>
                    <span class="meta-value">${pkg.delivery_time}</span>
                  </div>
                </div>
              ` : ''}
            </div>
            
            <div class="selected-package-pricing">
              <div class="pricing-row">
                <span class="pricing-label">Package Price</span>
                <span class="pricing-value package-total">${price}</span>
              </div>
              <div class="pricing-row deposit-row">
                <span class="pricing-label">
                  <i class="fas fa-info-circle"></i>
                  Deposit Required (30%)
                </span>
                <span class="pricing-value deposit-amount">${deposit}</span>
              </div>
            </div>
            
            ${pkg.promotion_text ? `
              <div class="package-promotion-full">
                <i class="fas fa-tag"></i>
                <span>${pkg.promotion_text}</span>
              </div>
            ` : ''}
            
            <div class="change-package-section">
              <button class="btn btn-secondary btn-sm" id="changePackageBtn">
                <i class="fas fa-sync-alt"></i>
                Change Package
              </button>
            </div>
          </div>
        </div>
        
        <div class="booking-info-card">
          <div class="info-icon">
            <i class="fas fa-lightbulb"></i>
          </div>
          <h4>Next Steps</h4>
          <ol class="next-steps-list">
            <li>
              <i class="fas fa-calendar-alt"></i>
              <span>Choose your preferred date and time</span>
            </li>
            <li>
              <i class="fas fa-edit"></i>
              <span>Provide session details and requirements</span>
            </li>
            <li>
              <i class="fas fa-credit-card"></i>
              <span>Complete deposit payment</span>
            </li>
            <li>
              <i class="fas fa-check-circle"></i>
              <span>Receive confirmation and prepare for your session</span>
            </li>
          </ol>
          <div class="info-note">
            <i class="fas fa-shield-alt"></i>
            <p>Your booking is secure and can be rescheduled up to 48 hours before the session.</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById('changePackageBtn')?.addEventListener('click', () => {
      this.changePackage();
    });
  },

  changePackage() {
    Utils.hideBookingFlow();
    
    if (Packages.selectedCard) {
      Packages.selectedCard.classList.remove('selected');
      Packages.selectedCard = null;
    }
    STATE.selectedPackage = null;
    
    const packagesSection = document.getElementById('packages');
    if (packagesSection) {
      packagesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    Utils.showToast('Choose a different package', 'info');
  },

  async nextStep() {
    if (STATE.currentStep === 1) {
      if (!STATE.selectedPackage) {
        Utils.showToast('Please select a package', 'warning');
        return;
      }
    } else if (STATE.currentStep === 2) {
      if (!STATE.selectedDate) {
        Utils.showToast('Please select a date', 'warning');
        return;
      }
      if (!STATE.selectedStartTime || !STATE.selectedEndTime) {
        Utils.showToast('Please select start and end times', 'warning');
        return;
      }

      const isValid = await TimeSlots.validateAndHoldTimeSlot();
      if (!isValid) {
        return;
      }
    } else if (STATE.currentStep === 3) {
      const termsAgreed = document.getElementById('bookingTermsAgreed')?.checked;
      if (!termsAgreed) {
        Utils.showToast('Please accept the terms and conditions', 'warning');
        return;
      }

      this.collectBookingDetails();
    }

    STATE.currentStep++;
    this.updateStepUI();

    if (STATE.currentStep === 4) {
      this.updatePaymentSummary();
      this.setupMoMoCopyButtons(); // NEW: Setup copy functionality
    }
  },

  previousStep() {
    if (STATE.currentStep > 1) {
      STATE.currentStep--;
      this.updateStepUI();
    }
  },

  updateStepUI() {
    document.querySelectorAll('.progress-step').forEach((step, index) => {
      step.classList.remove('active', 'completed');
      
      const stepNumber = index + 1;
      if (stepNumber < STATE.currentStep) {
        step.classList.add('completed');
      } else if (stepNumber === STATE.currentStep) {
        step.classList.add('active');
      }
    });

    document.querySelectorAll('.booking-step').forEach((step, index) => {
      step.classList.remove('active');
      if (index + 1 === STATE.currentStep) {
        step.classList.add('active');
      }
    });

    const prevBtn = document.getElementById('prevStepBtn');
    const nextBtn = document.getElementById('nextStepBtn');
    const submitBtn = document.getElementById('submitBookingBtn');

    if (prevBtn) prevBtn.style.display = STATE.currentStep > 1 ? 'inline-flex' : 'none';
    if (nextBtn) nextBtn.style.display = STATE.currentStep < 4 ? 'inline-flex' : 'none';
    if (submitBtn) submitBtn.style.display = STATE.currentStep === 4 ? 'inline-flex' : 'none';

    if (STATE.currentStep === 2) {
      Calendar.render();
      if (STATE.selectedDate) {
        TimeSlots.updateTimeAvailability();
      }
    }
  },

  collectBookingDetails() {
    STATE.bookingData = {
      sessionLocation: document.getElementById('sessionLocation')?.value || '',
      numberOfPeople: parseInt(document.getElementById('numberOfPeople')?.value || 1),
      outfitChanges: parseInt(document.getElementById('outfitChanges')?.value || 1),
      specialRequests: document.getElementById('specialRequests')?.value || '',
    };
  },

  updatePaymentSummary() {
    const pkg = STATE.selectedPackage;
    
    document.getElementById('summaryPackage').textContent = pkg.name;
    document.getElementById('summaryDate').textContent = Utils.formatDate(STATE.selectedDate);
    document.getElementById('summaryTime').textContent = 
      `${Utils.formatTime(STATE.selectedStartTime)} - ${Utils.formatTime(STATE.selectedEndTime)}`;
    
    const duration = Utils.calculateDuration(STATE.selectedStartTime, STATE.selectedEndTime);
    document.getElementById('summaryDuration').textContent = 
      `${duration.hours}h ${duration.minutes}m`;
    
    document.getElementById('summaryTotal').textContent = Utils.formatCurrency(pkg.price);
    
    const deposit = pkg.deposit_amount || (pkg.price * 0.3);
    document.getElementById('summaryDeposit').textContent = Utils.formatCurrency(deposit);
  },

  // NEW: Setup copy buttons for MoMo number
  setupMoMoCopyButtons() {
    const momoNumbers = document.querySelectorAll('.momo-number-copy');
    
    momoNumbers.forEach(element => {
      element.style.cursor = 'pointer';
      element.title = 'Click to copy';
      
      element.addEventListener('click', () => {
        const number = element.getAttribute('data-number');
        Utils.copyToClipboard(number, 'MoMo number');
        
        // Visual feedback
        element.style.background = 'rgba(0, 122, 255, 0.1)';
        setTimeout(() => {
          element.style.background = '';
        }, 300);
      });
    });
  },

  async submitBooking() {
    const submitBtn = document.getElementById('submitBookingBtn');
    Utils.setButtonLoading(submitBtn, true);

    console.log('🔄 Starting booking submission...');

    try {
      const pkg = STATE.selectedPackage;
      const user = STATE.currentUser;

      if (!pkg || !STATE.selectedDate || !STATE.selectedStartTime || !STATE.selectedEndTime) {
        throw new Error('Missing required booking information');
      }

      console.log('📦 Package:', pkg.name);
      console.log('👤 User:', user ? user.email : 'Guest');

      let paymentProofUrl = null;
      const fileInput = document.getElementById('paymentProof');
      
      if (fileInput?.files.length > 0) {
        console.log('📤 Uploading payment proof...');
        paymentProofUrl = await this.uploadPaymentProof(fileInput.files[0]);
      }

      const duration = Utils.calculateDuration(STATE.selectedStartTime, STATE.selectedEndTime);

      if (!duration) {
        throw new Error('Invalid time duration');
      }

      const bookingData = {
        user_id: user ? user.id : null,
        user_email: user ? user.email : STATE.bookingData.clientEmail || 'guest@example.com',
        user_display_name: user ? (user.user_metadata?.full_name || user.email) : 'Guest',
        is_guest_booking: !user,
        guest_booking_token: user ? null : STATE.guestToken,
        package_id: pkg.id.toString(),
        package_name: pkg.name,
        package_subtitle: pkg.subtitle || '',
        package_description: pkg.description || '',
        package_category: pkg.category,
        price: parseFloat(pkg.price),
        duration: parseInt(pkg.duration),
        session_date: STATE.selectedDate,
        session_time: STATE.selectedStartTime,
        session_end_time: STATE.selectedEndTime,
        session_duration_minutes: duration.totalMinutes,
        session_location: STATE.bookingData.sessionLocation || '',
        number_of_people: parseInt(STATE.bookingData.numberOfPeople) || 1,
        outfit_changes: parseInt(STATE.bookingData.outfitChanges) || 1,
        special_requests: STATE.bookingData.specialRequests || '',
        client_name: user ? (user.user_metadata?.full_name || user.email) : (STATE.bookingData.clientName || 'Guest'),
        client_phone: user ? (user.user_metadata?.phone || '') : (STATE.bookingData.clientPhone || ''),
        client_email: user ? user.email : (STATE.bookingData.clientEmail || 'guest@example.com'),
        deposit_amount: parseFloat(pkg.deposit_amount || (pkg.price * 0.3)),
        deposit_paid: paymentProofUrl ? true : false,
        payment_proof_url: paymentProofUrl,
        transaction_reference: document.getElementById('transactionRef')?.value || '',
        payment_status: paymentProofUrl ? 'deposit_paid' : 'pending',
        terms_agreed: true,
        terms_agreed_at: new Date().toISOString(),
        session_status: 'pending'
      };

      console.log('💾 Inserting booking into database...');
      
      const { data: newBooking, error: bookingError } = await window.supabaseClient
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) {
        console.error('❌ Database error:', bookingError);
        throw new Error(`Database error: ${bookingError.message}`);
      }

      if (!newBooking) {
        throw new Error('No booking data returned from database');
      }

      console.log('✅ Booking created successfully:', newBooking.session_reference);

      try {
        await TimeSlots.bookTimeSlotPermanently(newBooking.id);
      } catch (slotError) {
        console.warn('⚠️ Time slot booking not available:', slotError.message);
      }

      Utils.hideBookingFlow();
      this.showSuccess(newBooking.session_reference);
      this.resetBookingFlow();

      Utils.showToast('Booking created successfully! 🎉', 'success');

    } catch (error) {
      console.error('❌ Booking submission error:', error);
      
      let errorMessage = 'Failed to create booking. ';
      
      if (error.message.includes('permission denied')) {
        errorMessage += 'Permission error. Please try signing out and back in.';
      } else if (error.message.includes('violates check constraint')) {
        errorMessage += 'Invalid data. Please check all fields.';
      } else if (error.message.includes('null value')) {
        errorMessage += 'Missing required information.';
      } else {
        errorMessage += error.message;
      }
      
      Utils.showToast(errorMessage, 'error');
      
    } finally {
      Utils.setButtonLoading(submitBtn, false);
    }
  },

  async uploadPaymentProof(file) {
    try {
      const user = STATE.currentUser;
      const fileName = `${user.id}/${Date.now()}_${file.name}`;

      const { data, error } = await window.supabaseClient.storage
        .from('payment-proofs')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = window.supabaseClient.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      return publicUrl;

    } catch (error) {
      console.error('Upload error:', error);
      Utils.showToast('Failed to upload payment proof', 'warning');
      return null;
    }
  },

  showSuccess(reference) {
    document.getElementById('bookingReference').textContent = reference || 'PENDING';
    Utils.showSuccessScreen();
  },

  resetBookingFlow() {
    STATE.currentStep = 1;
    STATE.selectedPackage = null;
    STATE.selectedDate = null;
    STATE.selectedStartTime = null;
    STATE.selectedEndTime = null;
    STATE.bookingData = {};
    STATE.heldSlotId = null;
    STATE.holdExpiresAt = null;

    document.getElementById('bookingDetailsForm')?.reset();
    document.getElementById('paymentProof').value = '';
    document.getElementById('transactionRef').value = '';
    document.getElementById('filePreview')?.classList.remove('active');

    TimeSlots.clearHoldTimer();
    this.updateStepUI();
  }
};

// ============================================
// TIME SLOTS, CALENDAR, DASHBOARD MODULES
// (Keep existing implementations)
// ============================================
const TimeSlots = {
  async validateAndHoldTimeSlot() {
    const startTime = STATE.selectedStartTime;
    const endTime = STATE.selectedEndTime;
    
    if (!startTime || !endTime) {
      Utils.showToast('Please select both start and end times', 'error');
      return false;
    }
    
    if (startTime >= endTime) {
      Utils.showToast('End time must be after start time', 'error');
      return false;
    }

    try {
      const { data, error } = await window.supabaseClient.rpc('check_time_slot_availability', {
        check_date: STATE.selectedDate,
        start_time: startTime,
        end_time: endTime
      });

      if (error) {
        console.warn('Availability check not available:', error);
        return true;
      }

      if (data && !data.available) {
        Utils.showToast(data.message || 'Time slot not available', 'error');
        return false;
      }
    } catch (err) {
      console.warn('Skipping availability check:', err);
    }

    try {
      const { data, error } = await window.supabaseClient.rpc('hold_time_slot', {
        slot_date: STATE.selectedDate,
        start_time: startTime,
        end_time: endTime,
        is_whole_day: false,
        guest_token: STATE.currentUser ? null : STATE.guestToken,
        hold_duration_minutes: 10
      });

      if (error) throw error;

      if (data && data.success) {
        STATE.heldSlotId = data.slot_id;
        STATE.holdExpiresAt = new Date(data.expires_at);
        this.startHoldTimer();
        Utils.showToast('Time slot reserved for 10 minutes', 'success');
        return true;
      } else {
        Utils.showToast(data?.message || 'Failed to hold time slot', 'error');
        return false;
      }
    } catch (error) {
      console.warn('Time slot hold not available:', error);
      return true;
    }
  },

  async releaseTimeSlotHold() {
    if (!STATE.heldSlotId) return;

    try {
      const { error } = await window.supabaseClient.rpc('release_time_slot_hold', {
        slot_id: STATE.heldSlotId,
        guest_token: STATE.currentUser ? null : STATE.guestToken
      });

      if (!error) {
        STATE.heldSlotId = null;
        STATE.holdExpiresAt = null;
        this.clearHoldTimer();
      }
    } catch (error) {
      console.warn('Failed to release hold:', error);
    }
  },

  async bookTimeSlotPermanently(bookingId) {
    try {
      const { data, error } = await window.supabaseClient.rpc('book_custom_time_slot', {
        booking_uuid: bookingId,
        slot_date: STATE.selectedDate,
        start_time: STATE.selectedStartTime,
        end_time: STATE.selectedEndTime,
        is_whole_day: false,
        guest_token: STATE.currentUser ? null : STATE.guestToken
      });

      if (error) throw error;

      if (data && data.success) {
        this.clearHoldTimer();
        return true;
      } else {
        Utils.showToast(data?.message || 'Failed to book time slot', 'error');
        return false;
      }
    } catch (error) {
      console.warn('Time slot booking not available:', error);
      return true;
    }
  },

  async updateTimeAvailability() {
    if (!STATE.selectedDate) return;
    
    const timeInfo = document.getElementById('timeInfo');
    if (!timeInfo) return;

    try {
      const { data: bookedSlots } = await window.supabaseClient
        .from('time_slots')
        .select('start_time, end_time, is_whole_day')
        .eq('slot_date', STATE.selectedDate)
        .eq('is_available', false);

      const now = new Date().toISOString();
      const { data: heldSlots } = await window.supabaseClient
        .from('time_slots')
        .select('start_time, end_time')
        .eq('slot_date', STATE.selectedDate)
        .not('held_by_user', 'is', null)
        .gt('hold_expires_at', now);

      const unavailableSlots = [...(bookedSlots || []), ...(heldSlots || [])];

      if (unavailableSlots.length > 0) {
        const slotList = unavailableSlots
          .map(slot => {
            if (slot.is_whole_day) return 'Entire day is booked';
            return `${Utils.formatTime(slot.start_time)} - ${Utils.formatTime(slot.end_time)}`;
          })
          .join(', ');
        
        timeInfo.innerHTML = `
          <div class="time-info-warning">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Unavailable times: ${slotList}</span>
          </div>
        `;
      } else {
        timeInfo.innerHTML = `
          <div class="time-info-success">
            <i class="fas fa-check-circle"></i>
            <span>All times available for this date</span>
          </div>
        `;
      }
    } catch (error) {
      console.warn('Could not fetch time slot availability:', error);
    }
  },

  startHoldTimer() {
    this.clearHoldTimer();
    
    STATE.holdTimer = setInterval(() => {
      const now = new Date();
      const timeLeft = STATE.holdExpiresAt - now;
      
      if (timeLeft <= 0) {
        this.clearHoldTimer();
        Utils.showToast('Your time slot hold has expired. Please select a new time.', 'warning');
        STATE.currentStep = 2;
        BookingFlow.updateStepUI();
        return;
      }
      
      if (timeLeft <= 120000 && timeLeft > 119000) {
        Utils.showToast('Your time slot will be released in 2 minutes!', 'warning');
      }
      
      if (timeLeft <= 60000 && timeLeft > 59000) {
        Utils.showToast('Your time slot will be released in 1 minute!', 'warning');
      }
      
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      const countdownEl = document.getElementById('holdCountdown');
      
      if (countdownEl) {
        countdownEl.textContent = `Time slot held for: ${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }, 1000);
  },

  clearHoldTimer() {
    if (STATE.holdTimer) {
      clearInterval(STATE.holdTimer);
      STATE.holdTimer = null;
    }
  }
};

const Calendar = {
  init() {
    console.log('📅 Initializing calendar...');
    this.setupCalendarNavigation();
    this.setupTouchEvents();
  },

  setupCalendarNavigation() {
    document.getElementById('prevMonth')?.addEventListener('click', () => {
      STATE.currentMonth--;
      if (STATE.currentMonth < 0) {
        STATE.currentMonth = 11;
        STATE.currentYear--;
      }
      this.render();
    });

    document.getElementById('nextMonth')?.addEventListener('click', () => {
      STATE.currentMonth++;
      if (STATE.currentMonth > 11) {
        STATE.currentMonth = 0;
        STATE.currentYear++;
      }
      this.render();
    });
  },

  setupTouchEvents() {
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;

    let touchStartX = 0;
    let touchEndX = 0;

    calendarDays.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    calendarDays.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });

    this.handleSwipe = () => {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          STATE.currentMonth++;
          if (STATE.currentMonth > 11) {
            STATE.currentMonth = 0;
            STATE.currentYear++;
          }
        } else {
          STATE.currentMonth--;
          if (STATE.currentMonth < 0) {
            STATE.currentMonth = 11;
            STATE.currentYear--;
          }
        }
        this.render();
      }
    };
  },

  render() {
    const title = document.getElementById('calendarTitle');
    const daysContainer = document.getElementById('calendarDays');

    if (!title || !daysContainer) return;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const displayMonth = STATE.isMobile && window.innerWidth < 360 
      ? monthNames[STATE.currentMonth].substring(0, 3)
      : monthNames[STATE.currentMonth];
    
    title.textContent = `${displayMonth} ${STATE.currentYear}`;

    daysContainer.innerHTML = '';

    const firstDay = new Date(STATE.currentYear, STATE.currentMonth, 1).getDay();
    const daysInMonth = new Date(STATE.currentYear, STATE.currentMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day other-month';
      daysContainer.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      dayElement.textContent = day;
      dayElement.setAttribute('role', 'button');
      dayElement.setAttribute('tabindex', '0');

      const currentDate = new Date(STATE.currentYear, STATE.currentMonth, day);
      currentDate.setHours(0, 0, 0, 0);

      if (currentDate.getTime() === today.getTime()) {
        dayElement.classList.add('today');
      }

      if (currentDate < today) {
        dayElement.classList.add('disabled');
        dayElement.setAttribute('aria-disabled', 'true');
      }

      if (STATE.selectedDate) {
        const selectedDate = new Date(STATE.selectedDate);
        selectedDate.setHours(0, 0, 0, 0);
        if (currentDate.getTime() === selectedDate.getTime()) {
          dayElement.classList.add('selected');
          dayElement.setAttribute('aria-selected', 'true');
        }
      }

      if (!dayElement.classList.contains('disabled')) {
        dayElement.addEventListener('click', (e) => {
          e.preventDefault();
          this.selectDate(currentDate, dayElement);
        });

        dayElement.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.selectDate(currentDate, dayElement);
          }
        });
      }

      daysContainer.appendChild(dayElement);
    }
  },

  selectDate(date, dayElement) {
    STATE.selectedDate = date.toISOString().split('T')[0];
    console.log('Date selected:', STATE.selectedDate);
    
    document.querySelectorAll('.calendar-day').forEach(day => {
      day.classList.remove('selected');
      day.removeAttribute('aria-selected');
    });
    
    dayElement.classList.add('selected');
    dayElement.setAttribute('aria-selected', 'true');
    
    TimeSlots.updateTimeAvailability();
    
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }
};

const Dashboard = {
  async loadDashboard() {
    if (!STATE.currentUser) return;

    try {
      try {
        const { data, error } = await window.supabaseClient.rpc('get_client_dashboard_data', {
          user_uuid: STATE.currentUser.id
        });

        if (error) throw error;

        if (data && data.success) {
          this.renderDashboard(data);
          return;
        }
      } catch (rpcError) {
        console.warn('RPC not available, using fallback');
      }

      const { data: bookings, error: bookingsError } = await window.supabaseClient
        .from('bookings')
        .select('*')
        .eq('user_id', STATE.currentUser.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (bookingsError) throw bookingsError;

      this.renderDashboard({
        success: true,
        profile: { display_name: STATE.currentUser.user_metadata?.full_name || 'User' },
        session_stats: {
          total_sessions: bookings.length,
          completed_sessions: bookings.filter(b => b.session_status === 'completed').length,
          pending_sessions: bookings.filter(b => b.session_status === 'pending').length
        },
        recent_sessions: bookings
      });

    } catch (error) {
      console.error('Dashboard load error:', error);
      Utils.showToast('Failed to load dashboard', 'error');
    }
  },

  renderDashboard(data) {
    const welcomeEl = document.getElementById('dashboardWelcome');
    if (data.profile && data.profile.display_name && welcomeEl) {
      welcomeEl.textContent = `Welcome back, ${data.profile.display_name}!`;
    }

    if (data.session_stats) {
      const totalEl = document.getElementById('totalBookings');
      const completedEl = document.getElementById('completedBookings');
      const pendingEl = document.getElementById('pendingBookings');

      if (totalEl) totalEl.textContent = data.session_stats.total_sessions || 0;
      if (completedEl) completedEl.textContent = data.session_stats.completed_sessions || 0;
      if (pendingEl) pendingEl.textContent = data.session_stats.pending_sessions || 0;
    }

    this.renderBookings(data.recent_sessions || []);
  },

  renderBookings(bookings) {
    const list = document.getElementById('bookingsList');
    if (!list) return;

    list.innerHTML = '';

    if (!bookings || bookings.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No bookings yet</p>';
      return;
    }

    bookings.forEach(booking => {
      const item = document.createElement('div');
      item.className = 'booking-item';
      
      const statusClass = booking.session_status.toLowerCase();
      
      item.innerHTML = `
        <div class="booking-header">
          <h4 class="booking-title">${booking.package_name}</h4>
          <span class="booking-status ${statusClass}">${booking.session_status}</span>
        </div>
        <div class="booking-details">
          <div>📅 ${Utils.formatDate(booking.session_date)}</div>
          <div>🕐 ${booking.session_time}</div>
          <div>📍 ${booking.session_location || 'TBD'}</div>
          <div>💰 ${Utils.formatCurrency(booking.price)}</div>
        </div>
      `;

      list.appendChild(item);
    });
  }
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎬 DOM Content Loaded - Starting application...');

  Utils.updateMobileState();
  window.addEventListener('resize', () => {
    Utils.updateMobileState();
  });

  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('hidden');
    }
  }, 1000);

  MobileNav.init();
  await Auth.init();
  await Packages.init();
  BookingFlow.init();
  Calendar.init();

  const setupModalClose = (modalId, closeId, overlayId) => {
    document.getElementById(closeId)?.addEventListener('click', () => Utils.hideModal(modalId));
    document.getElementById(overlayId)?.addEventListener('click', () => Utils.hideModal(modalId));
  };

  setupModalClose('authModal', 'authModalClose', 'authModalOverlay');
  setupModalClose('termsModal', 'termsModalClose', 'termsModalOverlay');

  document.getElementById('acceptTermsBtn')?.addEventListener('click', () => {
    Utils.hideModal('termsModal');
    const checkbox = document.getElementById('bookingTermsAgreed');
    if (checkbox) checkbox.checked = true;
  });

  document.getElementById('successCloseBtn')?.addEventListener('click', () => {
    Utils.hideSuccessScreen();
    window.location.reload();
  });

  document.getElementById('showTermsLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    Utils.showModal('termsModal');
  });

  document.getElementById('signOutBtn')?.addEventListener('click', () => {
    Auth.signOut();
  });

  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  setInterval(async () => {
    try {
      await window.supabaseClient?.rpc('cleanup_expired_slot_holds');
    } catch (error) {
      // Silently fail
    }
  }, 60000);

  window.addEventListener('beforeunload', () => {
    if (STATE.heldSlotId) {
      TimeSlots.releaseTimeSlotHold();
    }
  });

  console.log('✅ Application initialized successfully');
});

window.PackagesModule = Packages;
window.AppState = STATE;
window.AppUtils = Utils;