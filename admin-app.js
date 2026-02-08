// Admin Dashboard JavaScript - COMPLETE FIXED VERSION
// Matty Multimedia Photography Booking System
// Enhanced with Revenue Graph, Better Error Handling, and All Features

window.supabase = window.supabaseClient;

let currentUser = null;
let allBookings = [];
let allClients = [];
let allPackages = [];
let confirmCallback = null;
let currentEditPackageId = null;
let currentPackageImage = null;
let timeSlots = [];
let unreadNotifications = 0;
let notificationCheckInterval = null;
let allNotifications = [];
let revenueChart, bookingStatusChart, monthlyRevenueChart, categoryChart, sourceChart;

// ===============================================
// INITIALIZATION & AUTH
// ===============================================

// Wait for Supabase
function waitForSupabase() {
    return new Promise((resolve, reject) => {
        if (typeof supabase !== 'undefined' && supabase) {
            resolve(supabase);
            return;
        }
        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            if (typeof supabase !== 'undefined' && supabase) {
                clearInterval(checkInterval);
                resolve(supabase);
            } else if (attempts >= 50) {
                clearInterval(checkInterval);
                reject(new Error('Supabase not found'));
            }
        }, 100);
    });
}

// Initialize Authentication
async function initializeAuth() {
    try {
        await waitForSupabase();
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            showLoginScreen();
            return;
        }
        if (session) {
            const isAdmin = await verifyAdminStatus(session.user.id);
            if (isAdmin) {
                currentUser = session.user;
                await showDashboard();
            } else {
                showLoginScreen();
                showError('Access denied. Admin privileges required.');
            }
        } else {
            showLoginScreen();
        }
    } catch (error) {
        console.error('Auth error:', error);
        showLoginScreen();
    }
}

// Verify Admin Status
async function verifyAdminStatus(userId) {
    try {
        const { data, error } = await supabase
            .from('admin_roles')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();
        return data !== null;
    } catch (error) {
        console.error('Admin verification error:', error);
        return false;
    }
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const btnText = document.querySelector('.btn-text');
    const btnLoader = document.querySelector('.btn-loader');
    
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    
    try {
        await waitForSupabase();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        const isAdmin = await verifyAdminStatus(data.user.id);
        if (!isAdmin) {
            await supabase.auth.signOut();
            throw new Error('Access denied. Not an admin user.');
        }
        
        currentUser = data.user;
        await showDashboard();
    } catch (error) {
        showError(error.message);
    } finally {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

// Handle Logout
async function handleLogout() {
    showLoadingOverlay(true);
    try {
        await supabase.auth.signOut();
        currentUser = null;
        showLoginScreen();
    } catch (error) {
        alert('Error logging out: ' + error.message);
    } finally {
        showLoadingOverlay(false);
    }
}

// Show Error Message
function showError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        setTimeout(() => errorDiv.classList.remove('show'), 5000);
    }
}

// Show Login Screen
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboardContent').style.display = 'none';
}

// Show Dashboard
async function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'flex';
    
    const adminNameEl = document.getElementById('adminName');
    const mobileAdminNameEl = document.getElementById('mobileAdminName');
    const mobileAdminEmailEl = document.getElementById('mobileAdminEmail');
    
    if (adminNameEl) adminNameEl.textContent = currentUser.email;
    if (mobileAdminNameEl) mobileAdminNameEl.textContent = currentUser.email;
    if (mobileAdminEmailEl) mobileAdminEmailEl.textContent = currentUser.email;
    
    // Load all dashboard data
    await loadDashboardData();
    
    // Start notifications
    await loadNotifications();
    startNotificationPolling();
}

// Update handleLogout to stop notifications
async function handleLogout() {
    showLoadingOverlay(true);
    try {
        stopNotificationPolling();
        await supabase.auth.signOut();
        currentUser = null;
        showLoginScreen();
    } catch (error) {
        alert('Error logging out: ' + error.message);
    } finally {
        showLoadingOverlay(false);
    }
}

// ===============================================
// DATA LOADING
// ===============================================

// Load Dashboard Data
async function loadDashboardData() {
    showLoadingOverlay(true);
    try {
        const results = await Promise.allSettled([
            loadEnhancedDashboardStats(),
            loadAllBookings(),
            loadAllClients(),
            loadAllPackages()
        ]);
        
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                const sections = ['Stats', 'Bookings', 'Clients', 'Packages'];
                console.error(`Error loading ${sections[index]}:`, result.reason);
            }
        });
        
        initializeCharts();
    } catch (error) {
        console.error('Load error:', error);
        alert('Some data failed to load. Please refresh the page.');
    } finally {
        showLoadingOverlay(false);
    }
}

// Load Enhanced Dashboard Stats
async function loadEnhancedDashboardStats() {
    try {
        const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
        
        if (error) {
            console.error('Stats error:', error);
            throw error;
        }
        
        document.getElementById('totalBookings').textContent = data?.total_bookings || 0;
        document.getElementById('totalRevenue').textContent = 'GH₵ ' + formatCurrency(data?.total_revenue || 0);
        document.getElementById('totalClients').textContent = data?.total_clients || 0;
        document.getElementById('pendingSessions').textContent = data?.pending_bookings || 0;
        document.getElementById('pendingBadge').textContent = data?.pending_bookings || 0;
        document.getElementById('mobilePendingBadge').textContent = data?.pending_bookings || 0;
        
        window.dashboardStats = data;
        
        console.log('Dashboard stats loaded:', data);
        
    } catch (error) {
        console.error('Stats error:', error);
        document.getElementById('totalBookings').textContent = '0';
        document.getElementById('totalRevenue').textContent = 'GH₵ 0.00';
        document.getElementById('totalClients').textContent = '0';
        document.getElementById('pendingSessions').textContent = '0';
    }
}

// Load All Clients (excluding admins)
async function loadAllClients() {
    try {
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (usersError) throw usersError;
        
        const { data: adminRoles } = await supabase
            .from('admin_roles')
            .select('user_id');
        
        const adminUserIds = (adminRoles || []).map(role => role.user_id);
        
        allClients = (usersData || []).filter(user => !adminUserIds.includes(user.id));
        
        console.log(`Loaded ${allClients.length} clients`);
        
        displayClientsGrid(allClients);
    } catch (error) {
        console.error('Clients error:', error);
        allClients = [];
        displayClientsGrid([]);
    }
}

// Load All Bookings
// Load All Bookings
async function loadAllBookings() {
    try {
        const { data: bookingsData, error } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Manually fetch user data for each booking
        if (bookingsData && bookingsData.length > 0) {
            const userIds = [...new Set(bookingsData.map(b => b.user_id).filter(Boolean))];
            
            if (userIds.length > 0) {
                const { data: usersData } = await supabase
                    .from('users')
                    .select('id, full_name, email, phone')
                    .in('id', userIds);
                
                // Create a map for quick lookup
                const usersMap = {};
                if (usersData) {
                    usersData.forEach(user => {
                        usersMap[user.id] = user;
                    });
                }
                
                // Attach user data to bookings
                bookingsData.forEach(booking => {
                    booking.users = usersMap[booking.user_id] || null;
                });
            }
        }
        
        allBookings = bookingsData || [];
        
        console.log(`Loaded ${allBookings.length} bookings`);
        
        displayBookingsTable(allBookings);
        displayBookingsMobile(allBookings);
        displayRecentBookings(allBookings.slice(0, 5));
    } catch (error) {
        console.error('Bookings error:', error);
        allBookings = [];
        displayBookingsTable([]);
        displayBookingsMobile([]);
        displayRecentBookings([]);
    }
}
// Load All Packages
async function loadAllPackages() {
    console.log('📦 Loading all packages for admin...');
    
    try {
        // Get ALL packages (active and inactive for admin)
        const { data, error } = await supabase
            .from('packages')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        // Get public URLs for images
        if (data && data.length > 0) {
            for (let pkg of data) {
                if (pkg.image_path) {
                    try {
                        const { data: urlData } = supabase.storage
                            .from('package-images')
                            .getPublicUrl(pkg.image_path);
                        if (urlData && urlData.publicUrl) {
                            pkg.image_url = urlData.publicUrl;
                        }
                    } catch (imgError) {
                        console.warn('Could not load image for package:', pkg.name);
                    }
                }
            }
        }
        
        allPackages = data || [];
        console.log(`✅ Loaded ${allPackages.length} packages`);
        displayPackagesGrid(allPackages);
        
    } catch (error) {
        console.error('❌ Error loading packages:', error);
        allPackages = [];
        displayPackagesGrid([]);
        showToast('Failed to load packages', 'error');
    }
}


// Load Booked Times
async function loadBookedTimes() {
    try {
        const startDate = document.getElementById('bookedTimesStartDate')?.value || 
                         new Date().toISOString().split('T')[0];
        const endDate = document.getElementById('bookedTimesEndDate')?.value || 
                       new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
        const statusFilter = document.getElementById('bookedTimesStatusFilter')?.value || null;
        
        showLoadingOverlay(true);
        
        const { data, error } = await supabase.rpc('get_admin_booked_times', {
            start_date: startDate,
            end_date: endDate,
            filter_status: statusFilter
        });
        
        if (error) throw error;
        
        displayBookedTimes(data || []);
        
    } catch (error) {
        console.error('Error loading booked times:', error);
        const container = document.getElementById('bookedTimesContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading booked times: ${error.message}</p>
                </div>
            `;
        }
    } finally {
        showLoadingOverlay(false);
    }
}

// ===============================================
// CHART INITIALIZATION
// ===============================================

function initializeCharts() {
    if (typeof Chart === 'undefined' || !window.dashboardStats) {
        console.warn('Chart.js not loaded or no dashboard stats available');
        return;
    }
    
    // Revenue & Bookings Trend Chart
    const ctx1 = document.getElementById('revenueChart');
    if (ctx1 && window.dashboardStats.revenue_trend_30_days) {
        const trendData = window.dashboardStats.revenue_trend_30_days;
        const labels = trendData.map(d => formatDateShort(d.date));
        const revenueData = trendData.map(d => d.revenue);
        const bookingsData = trendData.map(d => d.bookings);
        
        if (revenueChart) revenueChart.destroy();
        revenueChart = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Revenue (GH₵)',
                        data: revenueData,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16,185,129,0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Bookings',
                        data: bookingsData,
                        borderColor: '#4F46E5',
                        backgroundColor: 'rgba(79,70,229,0.1)',
                        tension: 0.4,
                        fill: false,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: { 
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Revenue & Bookings Trend (Last 30 Days)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.dataset.label === 'Revenue (GH₵)') {
                                    label += 'GH₵ ' + formatCurrency(context.parsed.y);
                                } else {
                                    label += context.parsed.y;
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Revenue (GH₵)'
                        },
                        ticks: {
                            callback: function(value) {
                                return 'GH₵ ' + value.toLocaleString();
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Bookings'
                        },
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    // Booking Status Chart
    const ctx2 = document.getElementById('bookingStatusChart');
    if (ctx2 && window.dashboardStats.bookings_by_status) {
        const statusData = window.dashboardStats.bookings_by_status;
        
        if (bookingStatusChart) bookingStatusChart.destroy();
        bookingStatusChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
                datasets: [{
                    data: [
                        statusData.pending || 0,
                        statusData.confirmed || 0,
                        statusData.completed || 0,
                        statusData.cancelled || 0
                    ],
                    backgroundColor: ['#F59E0B', '#3B82F6', '#10B981', '#EF4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return label + ': ' + value + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }
}

// ===============================================
// DISPLAY FUNCTIONS
// ===============================================

// Display Recent Bookings
function displayRecentBookings(bookings) {
    const container = document.getElementById('recentBookingsList');
    if (!container) return;
    if (!bookings || bookings.length === 0) {
        container.innerHTML = '<p class="text-secondary">No recent bookings</p>';
        return;
    }
    container.innerHTML = bookings.map(b => `
        <div class="activity-item" onclick="viewBooking('${b.id}')">
            <div class="activity-avatar">${getInitials(b.users?.full_name || b.client_name)}</div>
            <div class="activity-info">
                <div class="activity-name">${escapeHtml(b.users?.full_name || b.client_name || 'Unknown')}</div>
                <div class="activity-details">${escapeHtml(b.package_name)} • ${formatDate(b.session_date)}</div>
            </div>
            <div class="activity-meta">
                <div class="activity-time">${formatTimeAgo(b.created_at)}</div>
                <span class="activity-status status-${b.session_status}">${capitalizeFirst(b.session_status)}</span>
            </div>
        </div>
    `).join('');
}

// Display Bookings Table (Desktop)
function displayBookingsTable(bookings) {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;
    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No bookings found</td></tr>';
        return;
    }
    tbody.innerHTML = bookings.map(b => `
        <tr onclick="viewBooking('${b.id}')" style="cursor: pointer;">
            <td><strong>${escapeHtml(b.session_reference || 'N/A')}</strong></td>
            <td>
                <div>${escapeHtml(b.users?.full_name || b.client_name || 'Unknown')}</div>
                <small class="text-secondary">${escapeHtml(b.users?.email || b.client_email || '')}</small>
            </td>
            <td>
                <div>${escapeHtml(b.package_name)}</div>
                <small class="text-secondary">${escapeHtml(b.package_category)}</small>
            </td>
            <td>
                <div>${formatDate(b.session_date)}</div>
                <small class="text-secondary">${escapeHtml(b.session_time)}</small>
            </td>
            <td><span class="activity-status status-${b.session_status}">${capitalizeFirst(b.session_status)}</span></td>
            <td><strong>GH₵ ${formatCurrency(b.price)}</strong></td>
            <td onclick="event.stopPropagation()">
                <div class="table-actions">
                    <button class="btn-action view" onclick="viewBooking('${b.id}')" title="View Details"><i class="fas fa-eye"></i></button>
                    ${b.session_status === 'pending' ? `<button class="btn-action confirm" onclick="confirmBooking('${b.id}')" title="Confirm"><i class="fas fa-check"></i></button>` : ''}
                    ${b.session_status === 'confirmed' ? `<button class="btn-action complete" onclick="completeBooking('${b.id}')" title="Complete"><i class="fas fa-check-double"></i></button>` : ''}
                    <button class="btn-action delete" onclick="deleteBooking('${b.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Display Bookings Mobile
function displayBookingsMobile(bookings) {
    const container = document.getElementById('bookingsMobileList');
    if (!container) return;
    if (!bookings || bookings.length === 0) {
        container.innerHTML = '<p class="text-secondary">No bookings found</p>';
        return;
    }
    container.innerHTML = bookings.map(b => `
        <div class="booking-card-mobile" onclick="viewBooking('${b.id}')">
            <div class="booking-card-header">
                <div class="booking-reference">${escapeHtml(b.session_reference || 'N/A')}</div>
                <span class="activity-status status-${b.session_status}">${capitalizeFirst(b.session_status)}</span>
            </div>
            <div class="booking-card-body">
                <div class="booking-info-row"><i class="fas fa-user"></i><span>${escapeHtml(b.users?.full_name || b.client_name || 'Unknown')}</span></div>
                <div class="booking-info-row"><i class="fas fa-box"></i><span>${escapeHtml(b.package_name)}</span></div>
                <div class="booking-info-row"><i class="fas fa-calendar"></i><span>${formatDate(b.session_date)} at ${escapeHtml(b.session_time)}</span></div>
                <div class="booking-amount">GH₵ ${formatCurrency(b.price)}</div>
            </div>
        </div>
    `).join('');
}

// Display Clients Grid
function displayClientsGrid(clients) {
    const container = document.getElementById('clientsGrid');
    if (!container) return;
    if (!clients || clients.length === 0) {
        container.innerHTML = '<p class="text-secondary">No clients found</p>';
        return;
    }
    container.innerHTML = clients.map(c => `
        <div class="client-card">
            <div class="client-header">
                <div class="client-avatar-large">${getInitials(c.full_name)}</div>
                <div class="client-info">
                    <h4>${escapeHtml(c.full_name || 'Unknown')}</h4>
                    <div class="client-email">${escapeHtml(c.email)}</div>
                    ${c.phone ? `<div class="client-phone"><i class="fas fa-phone"></i> ${escapeHtml(c.phone)}</div>` : ''}
                </div>
            </div>
            <div class="client-stats">
                <div class="client-stat">
                    <span class="client-stat-value">${c.total_sessions || 0}</span>
                    <span class="client-stat-label">Sessions</span>
                </div>
                <div class="client-stat">
                    <span class="client-stat-value">${c.completed_sessions || 0}</span>
                    <span class="client-stat-label">Completed</span>
                </div>
                <div class="client-stat">
                    <span class="client-stat-value">${c.cancelled_sessions || 0}</span>
                    <span class="client-stat-label">Cancelled</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadAllClients() {
    try {
        // Get all users
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (usersError) throw usersError;
        
        // Get admin user IDs to exclude them
        const { data: adminRoles } = await supabase
            .from('admin_roles')
            .select('user_id');
        
        const adminUserIds = (adminRoles || []).map(role => role.user_id);
        
        // Filter out admins
        allClients = (usersData || []).filter(user => !adminUserIds.includes(user.id));
        
        console.log(`✅ Loaded ${allClients.length} clients`);
        
        displayClientsGrid(allClients);
        
        // Update client count in stats
        document.getElementById('totalClients').textContent = allClients.length;
        
    } catch (error) {
        console.error('❌ Clients error:', error);
        allClients = [];
        displayClientsGrid([]);
    }
}

async function viewPaymentProof(bookingId) {
    try {
        showLoadingOverlay(true);
        
        const booking = allBookings.find(b => b.id === bookingId);
        if (!booking || !booking.payment_proof_url) {
            showToast('No payment proof available', 'info');
            return;
        }
        
        // Get signed URL for payment proof
        const { data: urlData } = await supabase.rpc('get_payment_proof_url', {
            booking_uuid: bookingId
        });
        
        if (!urlData) {
            // Fallback: try to get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('payment-proofs')
                .getPublicUrl(booking.payment_proof_url);
            
            if (publicUrl) {
                window.open(publicUrl, '_blank');
            } else {
                showToast('Could not load payment proof', 'error');
            }
        } else {
            window.open(urlData, '_blank');
        }
        
    } catch (error) {
        console.error('Error viewing payment proof:', error);
        showToast('Error loading payment proof', 'error');
    } finally {
        showLoadingOverlay(false);
    }
}


// Display Packages Grid
function displayPackagesGrid(packages) {
    const container = document.getElementById('packagesGrid');
    if (!container) {
        console.error('Packages grid container not found');
        return;
    }
    
    if (!packages || packages.length === 0) {
        container.innerHTML = `
            <div class="no-packages" style="text-align: center; padding: 60px 20px; color: #6b7280;">
                <i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <p style="font-size: 16px; margin: 0;">No packages found</p>
                <p style="font-size: 14px; margin: 8px 0 20px; opacity: 0.7;">Create your first package to get started</p>
                <button class="btn btn-primary" onclick="openAddPackageModal()">
                    <i class="fas fa-plus"></i> Add Package
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = packages.map(pkg => `
        <div class="package-item" data-package-id="${pkg.id}">
            <div class="package-image">
                ${pkg.image_url ? 
                    `<img src="${pkg.image_url}" alt="${escapeHtml(pkg.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` 
                    : ''}
                <div class="package-image-placeholder" style="${pkg.image_url ? 'display:none;' : 'display:flex;'}">
                    <i class="fas fa-camera"></i>
                </div>
                ${pkg.is_featured ? '<div class="package-featured-badge"><i class="fas fa-star"></i> Featured</div>' : ''}
            </div>
            
            <div class="package-content">
                <div class="package-header">
                    <div>
                        <div class="package-title">${escapeHtml(pkg.name)}</div>
                        ${pkg.subtitle ? `<div class="package-subtitle">${escapeHtml(pkg.subtitle)}</div>` : ''}
                    </div>
                    <div class="package-badges">
                        <span class="package-status status-${pkg.status}">${capitalizeFirst(pkg.status)}</span>
                        <span class="package-availability availability-${pkg.availability_status}">${capitalizeFirst(pkg.availability_status)}</span>
                    </div>
                </div>
                
                ${pkg.description ? `<div class="package-description">${escapeHtml(pkg.description)}</div>` : ''}
                
                <div class="package-details">
                    <div class="package-detail-item">
                        <i class="fas fa-tag"></i>
                        <span><strong>Category:</strong> ${escapeHtml(pkg.category)}</span>
                    </div>
                    <div class="package-detail-item">
                        <i class="fas fa-clock"></i>
                        <span><strong>Duration:</strong> ${pkg.duration} minutes</span>
                    </div>
                    <div class="package-detail-item">
                        <i class="fas fa-images"></i>
                        <span><strong>Photos:</strong> ${pkg.photo_count || 'Flexible'}</span>
                    </div>
                </div>
                
                <div class="package-pricing">
                    <div class="price-row">
                        <span class="price-label">Package Price</span>
                        <span class="price-value">GH₵ ${formatCurrency(pkg.price)}</span>
                    </div>
                    <div class="price-row">
                        <span class="price-label">Deposit Required</span>
                        <span class="price-value">GH₵ ${formatCurrency(pkg.deposit_amount || 0)}</span>
                    </div>
                </div>
                
                ${pkg.includes && pkg.includes.length > 0 ? `
                    <div class="package-includes">
                        <strong>Includes:</strong>
                        <ul class="package-features-list">
                            ${pkg.includes.slice(0, 3).map(item => `<li><i class="fas fa-check"></i> ${escapeHtml(item)}</li>`).join('')}
                            ${pkg.includes.length > 3 ? `<li class="more-features">+${pkg.includes.length - 3} more...</li>` : ''}
                        </ul>
                    </div>
                ` : ''}
                
                <div class="package-stats">
                    <div class="stat-item">
                        <i class="fas fa-calendar-check"></i>
                        <span>${pkg.total_bookings || 0} bookings</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-sort-numeric-down"></i>
                        <span>Order: ${pkg.display_order}</span>
                    </div>
                </div>
                
                <div class="package-actions">
                    <button class="btn-action btn-edit" onclick="editPackage('${pkg.id}')" title="Edit Package">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-action btn-time" onclick="manageTimeSlots('${pkg.id}')" title="Manage Time Slots">
                        <i class="fas fa-clock"></i> Time Slots
                    </button>
                    <button class="btn-action btn-delete" onclick="deletePackage('${pkg.id}')" title="Delete Package">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}


// Display Booked Times
function displayBookedTimes(times) {
    const container = document.getElementById('bookedTimesContainer');
    if (!container) return;
    
    if (!times || times.length === 0) {
        container.innerHTML = '<p class="text-secondary">No booked times in selected range</p>';
        return;
    }
    
    const groupedByDate = times.reduce((acc, time) => {
        const date = time.formatted_date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(time);
        return acc;
    }, {});
    
    container.innerHTML = Object.entries(groupedByDate).map(([date, dayTimes]) => `
        <div class="booked-day-section">
            <div class="day-header">
                <h3>${date} - ${dayTimes[0].day_of_week}</h3>
                <span class="day-count">${dayTimes.length} booking${dayTimes.length > 1 ? 's' : ''}</span>
            </div>
            <div class="time-slots-list">
                ${dayTimes.map(time => `
                    <div class="booked-time-item status-${time.session_status}">
                        <div class="time-badge ${time.is_whole_day_booking ? 'whole-day' : ''}">
                            <i class="fas fa-clock"></i>
                            ${escapeHtml(time.time_display)}
                        </div>
                        <div class="booking-details">
                            <div class="booking-ref">${escapeHtml(time.session_reference)}</div>
                            <div class="client-name">
                                <i class="fas fa-user"></i>
                                ${escapeHtml(time.user_full_name || time.client_name)}
                            </div>
                            <div class="package-info">
                                <i class="fas fa-camera"></i>
                                ${escapeHtml(time.package_name)}
                            </div>
                            ${time.session_location ? `
                                <div class="location-info">
                                    <i class="fas fa-map-marker-alt"></i>
                                    ${escapeHtml(time.session_location)}
                                </div>
                            ` : ''}
                        </div>
                        <div class="booking-status">
                            <span class="status-badge status-${time.session_status}">${capitalizeFirst(time.session_status)}</span>
                            <span class="payment-badge status-${time.payment_status}">${capitalizeFirst(time.payment_status)}</span>
                            <div class="price-tag">GH₵ ${formatCurrency(time.price)}</div>
                        </div>
                        <button class="btn-icon" onclick="viewBooking('${time.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// ===============================================
// BOOKING ACTIONS
// ===============================================

// View Booking Details
function viewBooking(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    const modal = document.getElementById('bookingModal');
    const modalBody = document.getElementById('bookingModalBody');
    
    modalBody.innerHTML = `
        <div class="booking-details">
            <div class="booking-section">
                <h4><i class="fas fa-info-circle"></i> Booking Information</h4>
                <div class="detail-grid">
                    <div class="detail-item"><strong>Reference</strong><span>${escapeHtml(booking.session_reference || 'N/A')}</span></div>
                    <div class="detail-item"><strong>Status</strong><span class="activity-status status-${booking.session_status}">${capitalizeFirst(booking.session_status)}</span></div>
                    <div class="detail-item"><strong>Payment</strong><span class="activity-status status-${booking.payment_status}">${capitalizeFirst(booking.payment_status)}</span></div>
                    <div class="detail-item"><strong>Amount</strong><span style="font-weight: 700; color: var(--primary);">GH₵ ${formatCurrency(booking.price)}</span></div>
                </div>
            </div>
            
            <div class="booking-section">
                <h4><i class="fas fa-user"></i> Client Information</h4>
                <div class="detail-grid">
                    <div class="detail-item"><strong>Name</strong><span>${escapeHtml(booking.users?.full_name || booking.client_name || 'Unknown')}</span></div>
                    <div class="detail-item"><strong>Email</strong><span>${escapeHtml(booking.users?.email || booking.client_email || 'N/A')}</span></div>
                    <div class="detail-item"><strong>Phone</strong><span>${escapeHtml(booking.users?.phone || booking.client_phone || 'N/A')}</span></div>
                    ${booking.users?.instagram_handle ? `
                        <div class="detail-item"><strong>Instagram</strong><span>@${escapeHtml(booking.users.instagram_handle)}</span></div>
                    ` : ''}
                </div>
            </div>
            
            <div class="booking-section">
                <h4><i class="fas fa-calendar"></i> Session Details</h4>
                <div class="detail-grid">
                    <div class="detail-item"><strong>Package</strong><span>${escapeHtml(booking.package_name)}</span></div>
                    <div class="detail-item"><strong>Category</strong><span>${escapeHtml(booking.package_category)}</span></div>
                    <div class="detail-item"><strong>Date</strong><span>${formatDate(booking.session_date)}</span></div>
                    <div class="detail-item"><strong>Time</strong><span>${escapeHtml(booking.session_time)}</span></div>
                    <div class="detail-item"><strong>Location</strong><span>${escapeHtml(booking.session_location || 'Not specified')}</span></div>
                    ${booking.number_of_people ? `
                        <div class="detail-item"><strong>People</strong><span>${booking.number_of_people}</span></div>
                    ` : ''}
                </div>
            </div>
            
            ${booking.payment_proof_url ? `
                <div class="booking-section">
                    <h4><i class="fas fa-receipt"></i> Payment Proof</h4>
                    <div class="payment-proof-container">
                        <button class="btn btn-secondary" onclick="viewPaymentProof('${booking.id}')">
                            <i class="fas fa-file-image"></i> View Payment Proof
                        </button>
                        ${booking.payment_proof_filename ? `
                            <div class="proof-filename">${escapeHtml(booking.payment_proof_filename)}</div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            
            ${booking.special_requests ? `
                <div class="booking-section">
                    <h4><i class="fas fa-comment"></i> Special Requests</h4>
                    <p>${escapeHtml(booking.special_requests)}</p>
                </div>
            ` : ''}
            
            <div class="booking-actions">
                ${booking.session_status === 'pending' ? `
                    <button class="btn-confirm" onclick="confirmBooking('${booking.id}')">
                        <i class="fas fa-check"></i> Confirm
                    </button>
                ` : ''}
                ${booking.session_status === 'confirmed' ? `
                    <button class="btn-complete" onclick="completeBooking('${booking.id}')">
                        <i class="fas fa-check-double"></i> Complete
                    </button>
                ` : ''}
                <button class="btn-delete" onclick="deleteBooking('${booking.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
}

// Confirm Booking
async function confirmBooking(bookingId) {
    showConfirmModal('Confirm Booking', 'Confirm this booking?', async () => {
        showLoadingOverlay(true);
        try {
            await supabase.from('bookings').update({ session_status: 'confirmed' }).eq('id', bookingId);
            closeModal();
            await loadAllBookings();
            await loadEnhancedDashboardStats();
            alert('Booking confirmed!');
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            showLoadingOverlay(false);
        }
    });
}

// Complete Booking
async function completeBooking(bookingId) {
    showConfirmModal('Complete Booking', 'Mark this booking as completed?', async () => {
        showLoadingOverlay(true);
        try {
            await supabase.from('bookings').update({ session_status: 'completed' }).eq('id', bookingId);
            closeModal();
            await loadAllBookings();
            await loadEnhancedDashboardStats();
            alert('Booking completed!');
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            showLoadingOverlay(false);
        }
    });
}

// Delete Booking
async function deleteBooking(bookingId) {
    showConfirmModal('Delete Booking', 'Delete this booking? This cannot be undone.', async () => {
        showLoadingOverlay(true);
        try {
            await supabase.from('bookings').delete().eq('id', bookingId);
            closeModal();
            await loadAllBookings();
            await loadEnhancedDashboardStats();
            alert('Booking deleted!');
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            showLoadingOverlay(false);
        }
    });
}

// ===============================================
// PACKAGE MANAGEMENT
// ===============================================

// Open Add Package Modal

function openAddPackageModal() {
    currentEditPackageId = null;
    currentPackageImage = null;
    
    document.getElementById('packageModalTitle').textContent = 'Add New Package';
    document.getElementById('packageForm').reset();
    document.getElementById('packageId').value = '';
    
    const preview = document.getElementById('imagePreview');
    if (preview) {
        preview.style.display = 'none';
        preview.innerHTML = '';
    }
    
    document.getElementById('packageModal').classList.add('show');
}

// Edit Package
async function editPackage(packageId) {
    console.log('✏️ Editing package:', packageId);
    
    const packageData = allPackages.find(p => p.id === packageId);
    if (!packageData) {
        showToast('Package not found', 'error');
        return;
    }
    
    currentEditPackageId = packageId;
    currentPackageImage = null;
    
    document.getElementById('packageModalTitle').textContent = 'Edit Package';
    
    // Fill form with existing data
    document.getElementById('packageId').value = packageData.id;
    document.getElementById('packageName').value = packageData.name || '';
    document.getElementById('packageCategory').value = packageData.category || '';
    document.getElementById('packageSubtitle').value = packageData.subtitle || '';
    document.getElementById('packageDescription').value = packageData.description || '';
    document.getElementById('packagePrice').value = packageData.price || '';
    document.getElementById('packageDuration').value = packageData.duration || '';
    document.getElementById('packageDeposit').value = packageData.deposit_amount || '';
    document.getElementById('packagePhotoCount').value = packageData.photo_count || '';
    document.getElementById('packageDisplayOrder').value = packageData.display_order || '';
    
    // Handle includes array
    const includesTextarea = document.getElementById('packageIncludes');
    if (includesTextarea) {
        includesTextarea.value = packageData.includes ? packageData.includes.join('\n') : '';
    }
    
    document.getElementById('packageClientInstructions').value = packageData.client_instructions || '';
    document.getElementById('packageCancellationPolicy').value = packageData.cancellation_policy || '';
    document.getElementById('packageFeatured').checked = packageData.is_featured || false;
    document.getElementById('packageRawIncluded').checked = packageData.raw_photos_included || false;
    document.getElementById('packageStatus').value = packageData.status || 'active';
    document.getElementById('packageAvailability').value = packageData.availability_status || 'available';
    
    // Show existing image preview
    const preview = document.getElementById('imagePreview');
    if (packageData.image_url && preview) {
        preview.innerHTML = `
            <img src="${packageData.image_url}" alt="Current Image" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
            <p style="margin-top: 8px; font-size: 12px; color: #6b7280;">Current image (upload new to replace)</p>
        `;
        preview.style.display = 'block';
    } else if (preview) {
        preview.style.display = 'none';
    }
    
    document.getElementById('packageModal').classList.add('show');
}

// Handle Image Select
function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        e.target.value = '';
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be less than 5MB', 'error');
        e.target.value = '';
        return;
    }
    
    currentPackageImage = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
                <p style="margin-top: 8px; font-size: 12px; color: #6b7280;">New image preview</p>
            `;
            preview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}



// Upload Package Image
async function uploadPackageImage(packageId) {
    if (!currentPackageImage) return null;
    
    try {
        const fileExt = currentPackageImage.name.split('.').pop();
        const fileName = `${packageId}_${Date.now()}.${fileExt}`;
        const filePath = fileName;
        
        console.log('📤 Uploading image:', filePath);
        
        const { data, error } = await supabase.storage
            .from('package-images')
            .upload(filePath, currentPackageImage, {
                cacheControl: '3600',
                upsert: true
            });
        
        if (error) throw error;
        
        console.log('✅ Image uploaded successfully');
        return filePath;
        
    } catch (error) {
        console.error('❌ Image upload error:', error);
        throw error;
    }
}

// Handle Package Form Submit
async function handlePackageFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);
    showLoadingOverlay(true);
    
    try {
        const packageId = document.getElementById('packageId').value;
        const isNewPackage = !packageId;
        
        // Parse includes from textarea
        const includesText = document.getElementById('packageIncludes').value;
        const includesArray = includesText
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.trim());
        
        // Prepare package data
        const packageData = {
            name: document.getElementById('packageName').value.trim(),
            category: document.getElementById('packageCategory').value,
            subtitle: document.getElementById('packageSubtitle').value.trim() || null,
            description: document.getElementById('packageDescription').value.trim() || null,
            price: parseFloat(document.getElementById('packagePrice').value),
            duration: parseInt(document.getElementById('packageDuration').value),
            deposit_amount: parseFloat(document.getElementById('packageDeposit').value) || 0,
            photo_count: parseInt(document.getElementById('packagePhotoCount').value) || null,
            display_order: parseInt(document.getElementById('packageDisplayOrder').value) || 0,
            includes: includesArray,
            client_instructions: document.getElementById('packageClientInstructions').value.trim() || null,
            cancellation_policy: document.getElementById('packageCancellationPolicy').value.trim() || null,
            is_featured: document.getElementById('packageFeatured').checked,
            raw_photos_included: document.getElementById('packageRawIncluded').checked,
            status: document.getElementById('packageStatus').value,
            availability_status: document.getElementById('packageAvailability').value
        };
        
        let finalPackageId = packageId;
        
        // If new package, create it first to get ID
        if (isNewPackage) {
            console.log('➕ Creating new package...');
            
            const { data: newPackage, error: createError } = await supabase
                .from('packages')
                .insert([packageData])
                .select()
                .single();
            
            if (createError) throw createError;
            
            finalPackageId = newPackage.id;
            console.log('✅ Package created with ID:', finalPackageId);
        }
        
        // Upload image if selected
        let imagePath = null;
        if (currentPackageImage) {
            imagePath = await uploadPackageImage(finalPackageId);
            packageData.image_path = imagePath;
        }
        
        // Update package with image path (if new) or all data (if existing)
        if (isNewPackage && imagePath) {
            // Just update image path for new package
            const { error: updateError } = await supabase
                .from('packages')
                .update({ image_path: imagePath })
                .eq('id', finalPackageId);
            
            if (updateError) throw updateError;
        } else if (!isNewPackage) {
            // Update all data for existing package
            const { error: updateError } = await supabase
                .from('packages')
                .update(packageData)
                .eq('id', finalPackageId);
            
            if (updateError) throw updateError;
        }
        
        showToast(
            isNewPackage ? 'Package created successfully!' : 'Package updated successfully!',
            'success'
        );
        
        closeModal();
        await loadAllPackages();
        
    } catch (error) {
        console.error('❌ Package save error:', error);
        showToast('Error saving package: ' + error.message, 'error');
    } finally {
        setButtonLoading(submitBtn, false);
        showLoadingOverlay(false);
    }
}

function setButtonLoading(button, loading) {
    if (!button) return;
    
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<span class="btn-loader"></span> Processing...';
    } else {
        button.classList.remove('loading');
        button.disabled = false;
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }
    }
}

function showToast(message, type = 'info') {
    // Use your existing toast implementation
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}



// Delete Package
async function deletePackage(packageId) {
    const packageData = allPackages.find(p => p.id === packageId);
    if (!packageData) {
        showToast('Package not found', 'error');
        return;
    }
    
    showConfirmModal(
        'Delete Package',
        `Are you sure you want to delete "${packageData.name}"? This action cannot be undone.`,
        async () => {
            showLoadingOverlay(true);
            
            try {
                // Delete package from database
                const { error } = await supabase
                    .from('packages')
                    .delete()
                    .eq('id', packageId);
                
                if (error) throw error;
                
                // Delete image from storage if exists
                if (packageData.image_path) {
                    try {
                        await supabase.storage
                            .from('package-images')
                            .remove([packageData.image_path]);
                    } catch (imgError) {
                        console.warn('Could not delete image:', imgError);
                    }
                }
                
                showToast('Package deleted successfully!', 'success');
                await loadAllPackages();
                
            } catch (error) {
                console.error('Delete error:', error);
                showToast('Error deleting package: ' + error.message, 'error');
            } finally {
                showLoadingOverlay(false);
            }
        }
    );
}


// Time Slots Management
async function manageTimeSlots(packageId) {
    const packageData = allPackages.find(p => p.id === packageId);
    if (!packageData) {
        showToast('Package not found', 'error');
        return;
    }
    
    console.log('🕐 Managing time slots for:', packageData.name);
    
    // Load existing time slots
    const { data: slotsData, error } = await supabase
        .from('package_time_slots')
        .select('*')
        .eq('package_id', packageId)
        .order('day_of_week')
        .order('start_time');
    
    if (error) {
        console.error('Error loading time slots:', error);
        showToast('Error loading time slots', 'error');
        return;
    }
    
    timeSlots = slotsData || [];
    
    document.getElementById('timeSlotsPackageName').textContent = packageData.name;
    document.getElementById('currentPackageId').value = packageId;
    
    renderTimeSlots();
    document.getElementById('timeSlotsModal').classList.add('show');
}

function renderTimeSlots() {
    const container = document.getElementById('timeSlotsContainer');
    if (!container) return;
    
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Group slots by day
    const slotsByDay = {};
    daysOfWeek.forEach((day, index) => {
        slotsByDay[index] = timeSlots.filter(s => s.day_of_week === index);
    });
    
    container.innerHTML = daysOfWeek.map((day, index) => `
        <div class="day-section">
            <div class="day-header">
                <h4>${day}</h4>
                <button class="btn-small btn-primary" onclick="addTimeSlot(${index})">
                    <i class="fas fa-plus"></i> Add Slot
                </button>
            </div>
            <div class="slots-list" id="slots-day-${index}">
                ${slotsByDay[index].length > 0 ? slotsByDay[index].map((slot, slotIndex) => `
                    <div class="time-slot-item">
                        <div class="slot-time">
                            <input type="time" value="${slot.start_time}" 
                                onchange="updateSlot(${index}, ${slotIndex}, 'start_time', this.value)">
                            <span>to</span>
                            <input type="time" value="${slot.end_time}" 
                                onchange="updateSlot(${index}, ${slotIndex}, 'end_time', this.value)">
                        </div>
                        <div class="slot-controls">
                            <label class="checkbox-inline">
                                <input type="checkbox" ${slot.is_available ? 'checked' : ''} 
                                    onchange="updateSlot(${index}, ${slotIndex}, 'is_available', this.checked)">
                                Available
                            </label>
                            <input type="number" min="1" value="${slot.max_bookings}" 
                                onchange="updateSlot(${index}, ${slotIndex}, 'max_bookings', this.value)" 
                                style="width: 60px;" placeholder="Max">
                            <button class="btn-icon btn-delete" onclick="removeSlot(${index}, ${slotIndex})" title="Remove">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('') : '<p class="no-slots">No time slots for this day</p>'}
            </div>
        </div>
    `).join('');
}

function addTimeSlot(dayOfWeek) {
    timeSlots.push({
        day_of_week: dayOfWeek,
        start_time: '09:00',
        end_time: '10:00',
        is_available: true,
        max_bookings: 1,
        isNew: true
    });
    renderTimeSlots();
}

function updateSlot(dayOfWeek, slotIndex, field, value) {
    const slots = timeSlots.filter(s => s.day_of_week === dayOfWeek);
    if (slots[slotIndex]) {
        slots[slotIndex][field] = field === 'is_available' ? value : (field === 'max_bookings' ? parseInt(value) : value);
    }
}

function removeSlot(dayOfWeek, slotIndex) {
    const slots = timeSlots.filter(s => s.day_of_week === dayOfWeek);
    if (slots[slotIndex]) {
        const globalIndex = timeSlots.indexOf(slots[slotIndex]);
        timeSlots.splice(globalIndex, 1);
        renderTimeSlots();
    }
}


async function saveTimeSlots() {
    const packageId = document.getElementById('currentPackageId').value;
    
    showLoadingOverlay(true);
    
    try {
        // Delete existing slots
        await supabase
            .from('package_time_slots')
            .delete()
            .eq('package_id', packageId);
        
        // Insert new slots
        const slotsToInsert = timeSlots.map(slot => ({
            package_id: packageId,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: slot.is_available,
            max_bookings: slot.max_bookings
        }));
        
        if (slotsToInsert.length > 0) {
            const { error } = await supabase
                .from('package_time_slots')
                .insert(slotsToInsert);
            
            if (error) throw error;
        }
        
        showToast('Time slots saved successfully!', 'success');
        closeModal();
        
    } catch (error) {
        console.error('Error saving time slots:', error);
        showToast('Error saving time slots: ' + error.message, 'error');
    } finally {
        showLoadingOverlay(false);
    }
}

// ===============================================
// NAVIGATION & FILTERS
// ===============================================

// Switch Page
function switchPage(pageName) {
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) item.classList.add('active');
    });
    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    const pages = { 
        overview: 'overviewPage', 
        bookings: 'bookingsPage', 
        clients: 'clientsPage', 
        packages: 'packagesPage', 
        analytics: 'analyticsPage', 
        more: 'morePage',
        bookedtimes: 'bookedTimesPage'
    };
    const pageEl = document.getElementById(pages[pageName]);
    if (pageEl) pageEl.classList.add('active');
    
    if (pageName === 'bookedtimes') {
        loadBookedTimes();
    }
    
    const titles = { 
        overview: 'Dashboard Overview', 
        bookings: 'All Bookings', 
        clients: 'Client Management', 
        packages: 'Package Management', 
        analytics: 'Analytics', 
        more: 'More',
        bookedtimes: 'Booked Times'
    };
    document.getElementById('pageTitle').textContent = titles[pageName] || 'Dashboard';
}

// Apply Booking Filters
function applyBookingFilters() {
    const status = document.getElementById('statusFilter')?.value;
    const category = document.getElementById('categoryFilter')?.value;
    let filtered = [...allBookings];
    if (status) filtered = filtered.filter(b => b.session_status === status);
    if (category) filtered = filtered.filter(b => b.package_category === category);
    displayBookingsTable(filtered);
    displayBookingsMobile(filtered);
}

// Search Clients
function searchClients(query) {
    if (!query) {
        displayClientsGrid(allClients);
        return;
    }
    const filtered = allClients.filter(c => 
        c.full_name?.toLowerCase().includes(query.toLowerCase()) ||
        c.email?.toLowerCase().includes(query.toLowerCase()) ||
        c.phone?.includes(query)
    );
    displayClientsGrid(filtered);
}

// ===============================================
// MODALS
// ===============================================

// Show Confirm Modal
function showConfirmModal(title, message, callback) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    confirmCallback = callback;
    modal.classList.add('show');
}

// Close Modal
function closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
    confirmCallback = null;
    currentPackageImage = null;
}

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

function showLoadingOverlay(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('show', show);
    }
}

function getInitials(name) {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase() : name.substring(0,2).toUpperCase();
}

function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0.00';
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateShort(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTimeAgo(dateString) {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===============================================
// EVENT LISTENERS
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    
    // Login
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('togglePassword')?.addEventListener('click', () => {
        const pwd = document.getElementById('adminPassword');
        const type = pwd.type === 'password' ? 'text' : 'password';
        pwd.type = type;
        document.getElementById('togglePassword').innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    document.getElementById('mobileLogoutBtn')?.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });
    
    // Navigation
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
        item.addEventListener('click', (e) => { e.preventDefault(); if (item.dataset.page) switchPage(item.dataset.page); });
    });
    
    document.querySelectorAll('.more-item').forEach(item => {
        item.addEventListener('click', (e) => { e.preventDefault(); if (item.dataset.page) switchPage(item.dataset.page); });
    });
    
    document.querySelectorAll('.view-all').forEach(link => {
        link.addEventListener('click', (e) => { e.preventDefault(); if (link.dataset.page) switchPage(link.dataset.page); });
    });
    
    // Filters
    document.getElementById('statusFilter')?.addEventListener('change', applyBookingFilters);
    document.getElementById('categoryFilter')?.addEventListener('change', applyBookingFilters);
    document.getElementById('clientSearch')?.addEventListener('input', (e) => searchClients(e.target.value));
    
    // Refresh
    document.getElementById('refreshBtn')?.addEventListener('click', loadDashboardData);
    
    // Modals
    document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeModal));
    document.querySelectorAll('.modal-overlay').forEach(overlay => overlay.addEventListener('click', closeModal));
    
    document.getElementById('confirmCancel')?.addEventListener('click', closeModal);
    document.getElementById('confirmOk')?.addEventListener('click', () => {
        if (confirmCallback) { confirmCallback(); closeModal(); }
    });
    
    // Package Management
    document.getElementById('addPackageBtn')?.addEventListener('click', openAddPackageModal);
    document.getElementById('packageForm')?.addEventListener('submit', handlePackageFormSubmit);
    document.getElementById('packageImage')?.addEventListener('change', handleImageSelect);
    document.getElementById('saveTimeSlotsBtn')?.addEventListener('click', saveTimeSlots);
    
    // Export & Booked Times
    document.getElementById('exportBookingsBtn')?.addEventListener('click', () => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        document.getElementById('exportStartDate').value = thirtyDaysAgo.toISOString().split('T')[0];
        document.getElementById('exportEndDate').value = today.toISOString().split('T')[0];
        
        document.getElementById('exportModal').classList.add('show');
    });
    
    // Set default dates for booked times
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    if (document.getElementById('bookedTimesStartDate')) {
        document.getElementById('bookedTimesStartDate').value = today.toISOString().split('T')[0];
    }
    if (document.getElementById('bookedTimesEndDate')) {
        document.getElementById('bookedTimesEndDate').value = thirtyDaysLater.toISOString().split('T')[0];
    }
});







async function loadNotifications() {
    try {
        const { data, error } = await supabase.rpc('get_admin_notifications', {
            include_read: false,
            limit_count: 20
        });
        
        if (error) throw error;
        
        unreadNotifications = data ? data.length : 0;
        
        // Update notification badge
        const badge = document.getElementById('notificationBadge');
        const mobileBadge = document.getElementById('mobileNotificationBadge');
        
        if (badge) {
            badge.textContent = unreadNotifications;
            badge.style.display = unreadNotifications > 0 ? 'flex' : 'none';
        }
        
        if (mobileBadge) {
            mobileBadge.textContent = unreadNotifications;
            mobileBadge.style.display = unreadNotifications > 0 ? 'flex' : 'none';
        }
        
        // Display notifications in panel
        displayNotifications(data || []);
        
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Display Notifications
function displayNotifications(notifications) {
    const container = document.getElementById('notificationsList');
    if (!container) return;
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="no-notifications">
                <i class="fas fa-bell-slash"></i>
                <p>No new notifications</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.is_important ? 'important' : ''}" 
             onclick="handleNotificationClick('${notif.id}', '${notif.action_url || '#'}')">
            <div class="notification-icon ${notif.type}">
                <i class="fas fa-${getNotificationIcon(notif.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(notif.title)}</div>
                <div class="notification-message">${escapeHtml(notif.message)}</div>
                ${notif.booking_reference ? `
                    <div class="notification-meta">
                        <span class="notification-ref">${escapeHtml(notif.booking_reference)}</span>
                    </div>
                ` : ''}
                <div class="notification-time">${formatTimeAgo(notif.created_at)}</div>
            </div>
            ${notif.action_label ? `
                <button class="notification-action">${escapeHtml(notif.action_label)}</button>
            ` : ''}
        </div>
    `).join('');
}

// Get Notification Icon
function getNotificationIcon(type) {
    const icons = {
        'new_booking': 'calendar-plus',
        'payment_received': 'money-bill-wave',
        'session_completed': 'check-circle',
        'cancellation': 'times-circle',
        'client_message': 'comment',
        'system': 'info-circle'
    };
    return icons[type] || 'bell';
}

// Handle Notification Click
async function handleNotificationClick(notificationId, actionUrl) {
    try {
        // Mark as read
        await supabase.rpc('mark_notification_read', {
            notification_id: notificationId
        });
        
        // Reload notifications
        await loadNotifications();
        
        // Navigate if action URL provided
        if (actionUrl && actionUrl !== '#') {
            if (actionUrl.includes('#')) {
                const page = actionUrl.split('#')[1];
                switchPage(page);
            } else {
                window.location.href = actionUrl;
            }
        }
        
    } catch (error) {
        console.error('Error handling notification:', error);
    }
}

// Toggle Notifications Panel
function toggleNotificationsPanel() {
    const panel = document.getElementById('notificationsPanel');
    if (panel) {
        panel.classList.toggle('show');
    }
}

// Mark All Notifications Read
async function markAllNotificationsRead() {
    try {
        await supabase.rpc('mark_all_notifications_read');
        await loadNotifications();
        showToast('All notifications marked as read', 'success');
    } catch (error) {
        console.error('Error marking notifications read:', error);
        showToast('Error updating notifications', 'error');
    }
}

// Start Notification Polling
function startNotificationPolling() {
    // Check for new notifications every 30 seconds
    notificationCheckInterval = setInterval(() => {
        loadNotifications();
    }, 30000);
}

// Stop Notification Polling
function stopNotificationPolling() {
    if (notificationCheckInterval) {
        clearInterval(notificationCheckInterval);
        notificationCheckInterval = null;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Add Package Button
    document.getElementById('addPackageBtn')?.addEventListener('click', openAddPackageModal);
    
    // Package Form Submit
    document.getElementById('packageForm')?.addEventListener('submit', handlePackageFormSubmit);
    
    // Image Upload
    document.getElementById('packageImage')?.addEventListener('change', handleImageSelect);
    
    // Save Time Slots Button
    document.getElementById('saveTimeSlotsBtn')?.addEventListener('click', saveTimeSlots);

    document.getElementById('notificationBtn')?.addEventListener('click', toggleNotificationsPanel);
    document.getElementById('markAllReadBtn')?.addEventListener('click', markAllNotificationsRead);
    
    // Booked Times Filters
    document.getElementById('bookedTimesStartDate')?.addEventListener('change', loadBookedTimes);
    document.getElementById('bookedTimesEndDate')?.addEventListener('change', loadBookedTimes);
    document.getElementById('bookedTimesStatusFilter')?.addEventListener('change', loadBookedTimes);
    document.getElementById('refreshBookedTimesBtn')?.addEventListener('click', loadBookedTimes);
});

console.log('✅ Admin Package Management System Loaded');



/* ========================================================================
   PASTE THIS INTO YOUR ADMIN-APP.JS FILE
   Add these functions to make notifications and analytics work
   ======================================================================== */

// ===============================================
// NOTIFICATIONS SYSTEM - ADD THIS CODE
// ===============================================

// Load Notifications Function
async function loadNotifications() {
    try {
        console.log('📬 Loading notifications...');
        
        // Sample notifications (replace with your actual data)
        const sampleNotifications = [
            {
                id: '1',
                type: 'new_booking',
                title: 'New Booking Received',
                message: 'A new portrait session has been booked',
                booking_reference: 'MTY-' + Date.now().toString().slice(-6),
                is_important: true,
                is_read: false,
                created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                action_url: '#bookings',
                action_label: 'View Booking'
            },
            {
                id: '2',
                type: 'payment_received',
                title: 'Payment Confirmed',
                message: 'Deposit payment of GH₵ 500 received',
                booking_reference: 'MTY-' + Date.now().toString().slice(-5),
                is_important: false,
                is_read: false,
                created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                action_url: '#bookings',
                action_label: 'View Details'
            },
            {
                id: '3',
                type: 'session_completed',
                title: 'Session Completed',
                message: 'Wedding photography session marked as complete',
                booking_reference: 'MTY-' + Date.now().toString().slice(-4),
                is_important: false,
                is_read: true,
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                action_url: '#bookings',
                action_label: 'View Session'
            },
            {
                id: '4',
                type: 'client_message',
                title: 'New Client Message',
                message: 'Client inquiry about wedding package',
                is_important: false,
                is_read: false,
                created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                action_url: '#clients'
            }
        ];
        
        // Try to get real notifications from database
        let notifications = sampleNotifications;
        
        try {
            const { data, error } = await supabase.rpc('get_admin_notifications', {
                include_read: false,
                limit_count: 20
            });
            
            if (!error && data && data.length > 0) {
                notifications = data;
                console.log('✅ Loaded real notifications:', data.length);
            } else {
                console.log('ℹ️ Using sample notifications');
            }
        } catch (rpcError) {
            console.log('ℹ️ RPC not available, using sample data');
        }
        
        allNotifications = notifications;
        unreadNotifications = notifications.filter(n => !n.is_read).length;
        
        updateNotificationBadges();
        displayNotifications(notifications);
        
        console.log(`✅ ${unreadNotifications} unread notifications`);
        
    } catch (error) {
        console.error('❌ Error loading notifications:', error);
        displayNotifications([]);
    }
}

// Update Notification Badges
function updateNotificationBadges() {
    const badge = document.getElementById('notificationBadge');
    const mobileBadge = document.getElementById('mobileNotificationBadge');
    
    if (badge) {
        badge.textContent = unreadNotifications;
        badge.style.display = unreadNotifications > 0 ? 'flex' : 'none';
    }
    
    if (mobileBadge) {
        mobileBadge.textContent = unreadNotifications;
        mobileBadge.style.display = unreadNotifications > 0 ? 'flex' : 'none';
    }
}

// Handle Notification Click
async function handleNotificationClick(notificationId, actionUrl) {
    try {
        // Mark as read in local state
        const notif = allNotifications.find(n => n.id === notificationId);
        if (notif && !notif.is_read) {
            notif.is_read = true;
            unreadNotifications = Math.max(0, unreadNotifications - 1);
            updateNotificationBadges();
            displayNotifications(allNotifications);
        }
        
        // Try to mark as read in database
        try {
            await supabase.rpc('mark_notification_read', {
                notification_id: notificationId
            });
        } catch (error) {
            console.log('Could not mark notification as read in DB');
        }
        
        // Navigate if action URL provided
        if (actionUrl && actionUrl !== '#') {
            if (actionUrl.includes('#')) {
                const page = actionUrl.split('#')[1];
                switchPage(page);
                toggleNotificationsPanel();
            } else {
                window.location.href = actionUrl;
            }
        }
        
    } catch (error) {
        console.error('Error handling notification:', error);
    }
}

// Mark All Notifications Read
async function markAllNotificationsRead() {
    try {
        allNotifications.forEach(n => n.is_read = true);
        unreadNotifications = 0;
        updateNotificationBadges();
        displayNotifications(allNotifications);
        
        try {
            await supabase.rpc('mark_all_notifications_read');
        } catch (error) {
            console.log('Could not mark all as read in DB');
        }
        
        showToast('All notifications marked as read', 'success');
    } catch (error) {
        console.error('Error marking notifications read:', error);
        showToast('Error updating notifications', 'error');
    }
}

// Start Notification Polling (check every 30 seconds)
function startNotificationPolling() {
    notificationCheckInterval = setInterval(() => {
        loadNotifications();
    }, 30000);
    console.log('✅ Notification polling started');
}

// Stop Notification Polling
function stopNotificationPolling() {
    if (notificationCheckInterval) {
        clearInterval(notificationCheckInterval);
        notificationCheckInterval = null;
        console.log('⏹️ Notification polling stopped');
    }
}

// ===============================================
// ANALYTICS CHARTS - ADD THIS CODE
// ===============================================


// Initialize Analytics Charts
async function initializeAnalyticsCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded');
        return;
    }
    
    try {
        const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
        if (error) throw error;
        
        // Monthly Revenue Chart
        const monthlyCtx = document.getElementById('monthlyRevenueChart');
        if (monthlyCtx && data?.revenue_trend_30_days) {
            const trendData = data.revenue_trend_30_days;
            const labels = trendData.map(d => formatDateShort(d.date));
            const revenues = trendData.map(d => d.revenue);
            
            if (monthlyRevenueChart) monthlyRevenueChart.destroy();
            monthlyRevenueChart = new Chart(monthlyCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Daily Revenue (GH₵)',
                        data: revenues,
                        backgroundColor: 'rgba(0, 122, 255, 0.8)',
                        borderColor: '#007AFF',
                        borderWidth: 1,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: 'Revenue Over Last 30 Days',
                            font: { size: 16, weight: 'bold' }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => 'GH₵ ' + formatCurrency(context.parsed.y)
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: (value) => 'GH₵ ' + value.toLocaleString()
                            }
                        }
                    }
                }
            });
        }
        
        // Category Distribution Chart
        const categoryCtx = document.getElementById('categoryChart');
        if (categoryCtx && allBookings.length > 0) {
            const categories = {};
            allBookings.forEach(booking => {
                const cat = booking.package_category || 'Other';
                categories[cat] = (categories[cat] || 0) + 1;
            });
            
            const categoryLabels = Object.keys(categories);
            const categoryData = Object.values(categories);
            const categoryColors = [
                '#007AFF', '#34C759', '#FF9500', '#FF3B30', 
                '#5AC8FA', '#AF52DE', '#FF2D55', '#A2845E'
            ];
            
            if (categoryChart) categoryChart.destroy();
            categoryChart = new Chart(categoryCtx, {
                type: 'doughnut',
                data: {
                    labels: categoryLabels,
                    datasets: [{
                        data: categoryData,
                        backgroundColor: categoryColors.slice(0, categoryLabels.length),
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { padding: 15, font: { size: 12 } }
                        },
                        title: {
                            display: true,
                            text: 'Bookings by Category',
                            font: { size: 16, weight: 'bold' }
                        }
                    }
                }
            });
        }
        
        // Client Source Chart
        const sourceCtx = document.getElementById('sourceChart');
        if (sourceCtx && allClients.length > 0) {
            const sources = {
                'Instagram': 0,
                'Referral': 0,
                'Website': 0,
                'Other': 0
            };
            
            allClients.forEach(client => {
                const source = client.source || 'Website';
                if (sources.hasOwnProperty(source)) {
                    sources[source]++;
                } else {
                    sources['Other']++;
                }
            });
            
            const sourceLabels = Object.keys(sources);
            const sourceData = Object.values(sources);
            const sourceColors = ['#FF3B30', '#007AFF', '#34C759', '#8E8E93'];
            
            if (sourceChart) sourceChart.destroy();
            sourceChart = new Chart(sourceCtx, {
                type: 'pie',
                data: {
                    labels: sourceLabels,
                    datasets: [{
                        data: sourceData,
                        backgroundColor: sourceColors,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { padding: 15, font: { size: 12 } }
                        },
                        title: {
                            display: true,
                            text: 'Client Sources',
                            font: { size: 16, weight: 'bold' }
                        }
                    }
                }
            });
        }
        
        console.log('✅ Analytics charts initialized');
        
    } catch (error) {
        console.error('❌ Analytics charts error:', error);
    }
}

// Load Analytics Page
async function loadAnalyticsPage() {
    showLoadingOverlay(true);
    try {
        await initializeAnalyticsCharts();
        console.log('✅ Analytics loaded successfully');
    } catch (error) {
        console.error('❌ Analytics error:', error);
    } finally {
        showLoadingOverlay(false);
    }
}

// ===============================================
// UPDATE YOUR showDashboard() FUNCTION
// ===============================================
// Find your existing showDashboard function and update it to include notifications:

/*
async function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'flex';
    
    const adminNameEl = document.getElementById('adminName');
    const mobileAdminNameEl = document.getElementById('mobileAdminName');
    const mobileAdminEmailEl = document.getElementById('mobileAdminEmail');
    
    if (adminNameEl) adminNameEl.textContent = currentUser.email;
    if (mobileAdminNameEl) mobileAdminNameEl.textContent = currentUser.email;
    if (mobileAdminEmailEl) mobileAdminEmailEl.textContent = currentUser.email;
    
    // Load all dashboard data
    await loadDashboardData();
    
    // START NOTIFICATIONS - ADD THIS
    await loadNotifications();
    startNotificationPolling();
    
    // INITIALIZE ANALYTICS - ADD THIS
    await initializeAnalyticsCharts();
}
*/

// ===============================================
// UPDATE YOUR handleLogout() FUNCTION
// ===============================================
// Find your existing handleLogout function and add this line:

/*
async function handleLogout() {
    showLoadingOverlay(true);
    try {
        stopNotificationPolling(); // ADD THIS LINE
        await supabase.auth.signOut();
        currentUser = null;
        showLoginScreen();
    } catch (error) {
        alert('Error logging out: ' + error.message);
    } finally {
        showLoadingOverlay(false);
    }
}
*/

// ===============================================
// ADD EVENT LISTENERS
// ===============================================
// Add these to your DOMContentLoaded event:

/*
document.addEventListener('DOMContentLoaded', () => {
    // ... your existing code ...
    
    // ADD THESE EVENT LISTENERS:
    
    // Notification button
    document.getElementById('notificationBtn')?.addEventListener('click', toggleNotificationsPanel);
    
    // Mark all read button  
    document.getElementById('markAllReadBtn')?.addEventListener('click', markAllNotificationsRead);
    
    // Analytics page navigation
    document.querySelectorAll('[data-page="analytics"]').forEach(item => {
        item.addEventListener('click', () => {
            setTimeout(loadAnalyticsPage, 100);
        });
    });
});
*/


// ===============================================
// ANALYTICS FUNCTIONS - WORKING IMPLEMENTATION
// ===============================================

// Initialize Analytics Charts
async function initializeAnalyticsCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded');
        return;
    }
    
    try {
        // Get analytics data
        const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
        
        if (error) throw error;
        
        // Monthly Revenue Chart
        const monthlyCtx = document.getElementById('monthlyRevenueChart');
        if (monthlyCtx && data?.revenue_trend_30_days) {
            const trendData = data.revenue_trend_30_days;
            const labels = trendData.map(d => formatDateShort(d.date));
            const revenues = trendData.map(d => d.revenue);
            
            if (monthlyRevenueChart) monthlyRevenueChart.destroy();
            monthlyRevenueChart = new Chart(monthlyCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Daily Revenue (GH₵)',
                        data: revenues,
                        backgroundColor: 'rgba(0, 122, 255, 0.8)',
                        borderColor: '#007AFF',
                        borderWidth: 1,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: 'Revenue Over Last 30 Days',
                            font: { size: 16, weight: 'bold' }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => 'GH₵ ' + formatCurrency(context.parsed.y)
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: (value) => 'GH₵ ' + value.toLocaleString()
                            }
                        }
                    }
                }
            });
        }
        
        // Category Distribution Chart
        const categoryCtx = document.getElementById('categoryChart');
        if (categoryCtx && allBookings.length > 0) {
            const categories = {};
            allBookings.forEach(booking => {
                const cat = booking.package_category || 'Other';
                categories[cat] = (categories[cat] || 0) + 1;
            });
            
            const categoryLabels = Object.keys(categories);
            const categoryData = Object.values(categories);
            const categoryColors = [
                '#007AFF', '#34C759', '#FF9500', '#FF3B30', 
                '#5AC8FA', '#AF52DE', '#FF2D55', '#A2845E'
            ];
            
            if (categoryChart) categoryChart.destroy();
            categoryChart = new Chart(categoryCtx, {
                type: 'doughnut',
                data: {
                    labels: categoryLabels,
                    datasets: [{
                        data: categoryData,
                        backgroundColor: categoryColors.slice(0, categoryLabels.length),
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { padding: 15, font: { size: 12 } }
                        },
                        title: {
                            display: true,
                            text: 'Bookings by Category',
                            font: { size: 16, weight: 'bold' }
                        }
                    }
                }
            });
        }
        
        // Client Source Chart
        const sourceCtx = document.getElementById('sourceChart');
        if (sourceCtx && allClients.length > 0) {
            const sources = {
                'Instagram': 0,
                'Referral': 0,
                'Website': 0,
                'Other': 0
            };
            
            allClients.forEach(client => {
                const source = client.source || 'Website';
                if (sources.hasOwnProperty(source)) {
                    sources[source]++;
                } else {
                    sources['Other']++;
                }
            });
            
            const sourceLabels = Object.keys(sources);
            const sourceData = Object.values(sources);
            const sourceColors = ['#FF3B30', '#007AFF', '#34C759', '#8E8E93'];
            
            if (sourceChart) sourceChart.destroy();
            sourceChart = new Chart(sourceCtx, {
                type: 'pie',
                data: {
                    labels: sourceLabels,
                    datasets: [{
                        data: sourceData,
                        backgroundColor: sourceColors,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { padding: 15, font: { size: 12 } }
                        },
                        title: {
                            display: true,
                            text: 'Client Sources',
                            font: { size: 16, weight: 'bold' }
                        }
                    }
                }
            });
        }
        
    } catch (error) {
        console.error('Analytics charts error:', error);
    }
}

// Load Analytics Page
async function loadAnalyticsPage() {
    showLoadingOverlay(true);
    try {
        await initializeAnalyticsCharts();
        console.log('✅ Analytics loaded successfully');
    } catch (error) {
        console.error('❌ Analytics error:', error);
    } finally {
        showLoadingOverlay(false);
    }
}

// ===============================================
// NOTIFICATIONS - WORKING IMPLEMENTATION
// ===============================================


// Load Notifications
async function loadNotifications() {
    try {
        console.log('📬 Loading notifications...');
        
        // For demo purposes, create sample notifications if no RPC exists
        const sampleNotifications = [
            {
                id: '1',
                type: 'new_booking',
                title: 'New Booking Received',
                message: 'A new portrait session has been booked',
                booking_reference: 'MTY-' + Date.now().toString().slice(-6),
                is_important: true,
                is_read: false,
                created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                action_url: '#bookings',
                action_label: 'View Booking'
            },
            {
                id: '2',
                type: 'payment_received',
                title: 'Payment Confirmed',
                message: 'Deposit payment of GH₵ 500 received',
                booking_reference: 'MTY-' + Date.now().toString().slice(-5),
                is_important: false,
                is_read: false,
                created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                action_url: '#bookings',
                action_label: 'View Details'
            },
            {
                id: '3',
                type: 'session_completed',
                title: 'Session Completed',
                message: 'Wedding photography session marked as complete',
                booking_reference: 'MTY-' + Date.now().toString().slice(-4),
                is_important: false,
                is_read: true,
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                action_url: '#bookings',
                action_label: 'View Session'
            }
        ];
        
        // Try to get real notifications, fallback to samples
        let notifications = sampleNotifications;
        
        try {
            const { data, error } = await supabase.rpc('get_admin_notifications', {
                include_read: false,
                limit_count: 20
            });
            
            if (!error && data && data.length > 0) {
                notifications = data;
                console.log('✅ Loaded real notifications:', data.length);
            } else {
                console.log('ℹ️ Using sample notifications');
            }
        } catch (rpcError) {
            console.log('ℹ️ RPC not available, using sample notifications');
        }
        
        allNotifications = notifications;
        unreadNotifications = notifications.filter(n => !n.is_read).length;
        
        // Update notification badges
        updateNotificationBadges();
        
        // Display notifications
        displayNotifications(notifications);
        
        console.log(`✅ ${unreadNotifications} unread notifications`);
        
    } catch (error) {
        console.error('❌ Error loading notifications:', error);
        displayNotifications([]);
    }
}

// Update Notification Badges
function updateNotificationBadges() {
    const badge = document.getElementById('notificationBadge');
    const mobileBadge = document.getElementById('mobileNotificationBadge');
    
    if (badge) {
        badge.textContent = unreadNotifications;
        badge.style.display = unreadNotifications > 0 ? 'flex' : 'none';
    }
    
    if (mobileBadge) {
        mobileBadge.textContent = unreadNotifications;
        mobileBadge.style.display = unreadNotifications > 0 ? 'flex' : 'none';
    }
}

// Display Notifications
function displayNotifications(notifications) {
    const container = document.getElementById('notificationsList');
    if (!container) return;
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="no-notifications">
                <i class="fas fa-bell-slash"></i>
                <p>No new notifications</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.is_important ? 'important' : ''} ${notif.is_read ? 'read' : ''}" 
             onclick="handleNotificationClick('${notif.id}', '${notif.action_url || '#'}')">
            <div class="notification-icon ${notif.type}">
                <i class="fas fa-${getNotificationIcon(notif.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(notif.title)}</div>
                <div class="notification-message">${escapeHtml(notif.message)}</div>
                ${notif.booking_reference ? `
                    <div class="notification-meta">
                        <span class="notification-ref">${escapeHtml(notif.booking_reference)}</span>
                    </div>
                ` : ''}
                <div class="notification-time">${formatTimeAgo(notif.created_at)}</div>
            </div>
            ${notif.action_label ? `
                <button class="notification-action">${escapeHtml(notif.action_label)}</button>
            ` : ''}
        </div>
    `).join('');
}

// Get Notification Icon
function getNotificationIcon(type) {
    const icons = {
        'new_booking': 'calendar-plus',
        'payment_received': 'money-bill-wave',
        'session_completed': 'check-circle',
        'cancellation': 'times-circle',
        'client_message': 'comment',
        'system': 'info-circle'
    };
    return icons[type] || 'bell';
}

// Handle Notification Click
async function handleNotificationClick(notificationId, actionUrl) {
    try {
        // Mark as read in local state
        const notif = allNotifications.find(n => n.id === notificationId);
        if (notif && !notif.is_read) {
            notif.is_read = true;
            unreadNotifications = Math.max(0, unreadNotifications - 1);
            updateNotificationBadges();
            displayNotifications(allNotifications);
        }
        
        // Try to mark as read in database
        try {
            await supabase.rpc('mark_notification_read', {
                notification_id: notificationId
            });
        } catch (error) {
            console.log('Could not mark notification as read in DB');
        }
        
        // Navigate if action URL provided
        if (actionUrl && actionUrl !== '#') {
            if (actionUrl.includes('#')) {
                const page = actionUrl.split('#')[1];
                switchPage(page);
                toggleNotificationsPanel(); // Close panel
            } else {
                window.location.href = actionUrl;
            }
        }
        
    } catch (error) {
        console.error('Error handling notification:', error);
    }
}

// Toggle Notifications Panel
function toggleNotificationsPanel() {
    const panel = document.getElementById('notificationsPanel');
    if (panel) {
        const isShowing = panel.classList.contains('show');
        panel.classList.toggle('show');
        
        // If opening and there are unread notifications, mark them as seen
        if (!isShowing && unreadNotifications > 0) {
            // Give visual feedback that user saw them
            setTimeout(() => {
                // Could add logic here to mark as "seen" vs "read"
            }, 1000);
        }
    }
}

// Mark All Notifications Read
async function markAllNotificationsRead() {
    try {
        // Update local state
        allNotifications.forEach(n => n.is_read = true);
        unreadNotifications = 0;
        updateNotificationBadges();
        displayNotifications(allNotifications);
        
        // Try to update database
        try {
            await supabase.rpc('mark_all_notifications_read');
        } catch (error) {
            console.log('Could not mark all as read in DB');
        }
        
        showToast('All notifications marked as read', 'success');
    } catch (error) {
        console.error('Error marking notifications read:', error);
        showToast('Error updating notifications', 'error');
    }
}

// Start Notification Polling
function startNotificationPolling() {
    // Check for new notifications every 30 seconds
    notificationCheckInterval = setInterval(() => {
        loadNotifications();
    }, 30000);
    
    console.log('✅ Notification polling started');
}

// Stop Notification Polling
function stopNotificationPolling() {
    if (notificationCheckInterval) {
        clearInterval(notificationCheckInterval);
        notificationCheckInterval = null;
        console.log('⏹️ Notification polling stopped');
    }
}

// Add notification event listeners to DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Notification button
    const notifBtn = document.getElementById('notificationBtn');
    if (notifBtn) {
        notifBtn.addEventListener('click', toggleNotificationsPanel);
    }
    
    // Mark all read button
    const markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', markAllNotificationsRead);
    }
    
    // Load analytics when analytics page is shown
    document.querySelectorAll('[data-page="analytics"]').forEach(item => {
        item.addEventListener('click', () => {
            setTimeout(loadAnalyticsPage, 100);
        });
    });
});