/* ============================================================
   KRYSTAL ATTENDANCE SYSTEM - Frontend Logic
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today for all date pickers
    const datePickers = document.querySelectorAll('input[type="date"]');
    if (datePickers.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        datePickers.forEach(picker => {
            if (!picker.value) {
                picker.value = today;
            }
        });
    }

    // Auto-focus first input on login page
    const loginInput = document.getElementById('username');
    if (loginInput) {
        loginInput.focus();
    }

    // Route to correct page initializer
    const currentPage = detectPage();
    if (currentPage === 'dashboard') {
        initDashboard();
    } else if (currentPage === 'add-attendance') {
        initAddAttendance();
    } else if (currentPage === 'preview') {
        initPreview();
    }
});

/* ============================================================
   HELPERS
   ============================================================ */

function detectPage() {
    if (document.getElementById('staff-name') && document.getElementById('staff-id')) {
        return 'add-attendance';
    }
    if (document.querySelector('.preview-stats')) {
        return 'preview';
    }
    // Dashboard has Saved Attendance Records heading
    const cardHeader = document.querySelector('.card-header h3');
    if (cardHeader && cardHeader.textContent.includes('Saved Attendance Records')) {
        return 'dashboard';
    }
    return 'unknown';
}

// Get all saved records from localStorage
function getAllRecords() {
    const data = localStorage.getItem('krystalRecords');
    return data ? JSON.parse(data) : [];
}

// Save all records to localStorage
function saveAllRecords(records) {
    localStorage.setItem('krystalRecords', JSON.stringify(records));
}

// Format date for display (e.g. "May 05, 2026")
function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

// Download a string as a file
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Generate CSV string from employee array
function generateCsv(employees, date) {
    let csv = 'Serial Number,Name,ID,Post,Status\n';
    employees.forEach((staff, i) => {
        const post = staff.post.charAt(0).toUpperCase() + staff.post.slice(1);
        const status = staff.status ? (staff.status.charAt(0).toUpperCase() + staff.status.slice(1)) : 'Present';
        csv += (i + 1) + ',"' + staff.name + '",' + staff.id + ',' + post + ',' + status + '\n';
    });
    return csv;
}

// Get icon class for a post
function getPostIcon(post) {
    const p = post.toLowerCase();
    if (p === 'guard') return 'fa-user-shield';
    if (p === 'supervisor') return 'fa-clipboard-user';
    if (p === 'bouncer') return 'fa-user-ninja';
    if (p === 'incharge') return 'fa-user-tie';
    if (p === 'driver') return 'fa-car';
    return 'fa-user';
}

/* ============================================================
   1. DASHBOARD PAGE
   ============================================================ */

function initDashboard() {
    const tbody = document.querySelector('.table-responsive tbody');
    const dateFilter = document.querySelector('.action-bar-left input[type="date"]');

    function renderDashboard() {
        const records = getAllRecords();
        const filterDate = dateFilter ? dateFilter.value : '';
        tbody.innerHTML = '';

        // Filter by date if user has selected one different from today
        let filtered = records;
        if (filterDate) {
            filtered = records.filter(r => r.date === filterDate);
        }

        if (filtered.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="2" style="text-align: center; color: var(--text-muted); padding: 2rem;">No attendance records found.</td>';
            tbody.appendChild(tr);
            return;
        }

        filtered.forEach((record, idx) => {
            // Find original index in full records array for delete/edit
            const origIndex = records.indexOf(record);
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td>' +
                    '<strong>' + formatDate(record.date) + '</strong>' +
                    '<div style="font-size: 0.85rem; color: var(--text-muted);"><i class="fa-solid fa-users"></i> ' + record.employees.length + ' Staff Present</div>' +
                '</td>' +
                '<td style="text-align: right;">' +
                    '<div class="flex justify-end gap-2">' +
                        '<button class="btn btn-outline btn-icon dash-edit-btn" data-index="' + origIndex + '" title="Edit">' +
                            '<i class="fa-solid fa-pen"></i>' +
                        '</button>' +
                        '<button class="btn btn-outline btn-icon dash-csv-btn" data-index="' + origIndex + '" title="Download CSV">' +
                            '<i class="fa-solid fa-file-csv"></i>' +
                        '</button>' +
                        '<button class="btn btn-danger btn-icon dash-delete-btn" data-index="' + origIndex + '" title="Delete">' +
                            '<i class="fa-regular fa-trash-can"></i>' +
                        '</button>' +
                    '</div>' +
                '</td>';
            tbody.appendChild(tr);
        });

        // Edit buttons
        tbody.querySelectorAll('.dash-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = parseInt(btn.getAttribute('data-index'));
                localStorage.setItem('editRecordIndex', i);
                window.location.href = 'add-attendance.html';
            });
        });

        // CSV buttons
        tbody.querySelectorAll('.dash-csv-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = parseInt(btn.getAttribute('data-index'));
                const rec = getAllRecords()[i];
                if (rec) {
                    const csv = generateCsv(rec.employees, rec.date);
                    downloadFile(csv, 'attendance_' + rec.date + '.csv', 'text/csv');
                }
            });
        });

        // Delete buttons
        tbody.querySelectorAll('.dash-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!confirm('Are you sure you want to delete this attendance record?')) return;
                const i = parseInt(btn.getAttribute('data-index'));
                const recs = getAllRecords();
                recs.splice(i, 1);
                saveAllRecords(recs);
                renderDashboard();
            });
        });
    }

    // Filter by date
    if (dateFilter) {
        dateFilter.value = ''; // clear default so all records show initially
        dateFilter.addEventListener('change', renderDashboard);
    }

    renderDashboard();
}

/* ============================================================
   2. ADD ATTENDANCE PAGE
   ============================================================ */

function initAddAttendance() {
    const form = document.querySelector('form.form-grid');
    const nameInput = document.getElementById('staff-name');
    const idInput = document.getElementById('staff-id');
    const postSelect = document.getElementById('staff-post');
    const statusSelect = document.getElementById('staff-status');
    const submitBtn = form.querySelector('button[type="submit"]');
    const tbody = document.querySelector('.table-responsive tbody');
    const searchInput = document.querySelector('.action-bar-left input[type="text"]');
    const dateInput = document.getElementById('attendance-date');

    const previewBtn = document.querySelector('a[href="preview.html"]');
    const finalSaveBtn = document.querySelector('a[href="dashboard.html"].btn-success');

    // Find action buttons by text content
    const allOutlineBtns = Array.from(document.querySelectorAll('button.btn-outline'));
    const exportCsvBtn = allOutlineBtns.find(b => b.textContent.includes('Export CSV'));
    const downloadPdfBtn = allOutlineBtns.find(b => b.textContent.includes('Download PDF'));

    let attendanceData = [];
    let editIndex = -1;

    // Check if we are editing an existing record from dashboard
    const editRecordIndex = localStorage.getItem('editRecordIndex');
    if (editRecordIndex !== null) {
        const records = getAllRecords();
        const idx = parseInt(editRecordIndex);
        if (records[idx]) {
            attendanceData = records[idx].employees.slice(); // clone
            if (dateInput) {
                dateInput.value = records[idx].date;
            }
        }
        localStorage.removeItem('editRecordIndex');
    }

    /* -- Render Table -- */
    function renderTable() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        tbody.innerHTML = '';

        let serial = 1;
        attendanceData.forEach((staff, index) => {
            const matchesSearch = staff.name.toLowerCase().includes(searchTerm) ||
                                  staff.id.toString().toLowerCase().includes(searchTerm);
            if (!matchesSearch) return;

            const iconClass = getPostIcon(staff.post);
            const displayPost = staff.post.charAt(0).toUpperCase() + staff.post.slice(1);

            let statusBadge = '';
            if (staff.status === 'absent') {
                statusBadge = '<span class="badge badge-danger">Absent</span>';
            } else if (staff.status === 'halfday') {
                statusBadge = '<span class="badge badge-warning" style="background: #f59e0b; color: white;">Half Day</span>';
            } else {
                statusBadge = '<span class="badge badge-success">Present</span>';
            }

            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td>' + (serial++) + '</td>' +
                '<td><i class="fa-solid ' + iconClass + '" style="color: var(--text-muted); margin-right: 8px;"></i> ' + staff.name + '</td>' +
                '<td>' + staff.id + '</td>' +
                '<td>' + displayPost + '</td>' +
                '<td>' + statusBadge + '</td>' +
                '<td style="text-align: right;">' +
                    '<div class="flex justify-end gap-2">' +
                        '<button type="button" class="btn btn-outline btn-icon edit-btn" data-index="' + index + '" title="Edit">' +
                            '<i class="fa-solid fa-pen"></i>' +
                        '</button>' +
                        '<button type="button" class="btn btn-danger btn-icon delete-btn" data-index="' + index + '" title="Delete">' +
                            '<i class="fa-regular fa-trash-can"></i>' +
                        '</button>' +
                    '</div>' +
                '</td>';
            tbody.appendChild(tr);
        });

        // Attach edit listeners
        tbody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = parseInt(btn.getAttribute('data-index'));
                editStaff(i);
            });
        });

        // Attach delete listeners
        tbody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = parseInt(btn.getAttribute('data-index'));
                deleteStaff(i);
            });
        });
    }

    /* -- Add / Update -- */
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = nameInput.value.trim();
        const id = idInput.value.trim();
        const post = postSelect.value;
        const status = statusSelect.value;

        if (!name) { alert('Please enter a name.'); return; }
        if (!id || isNaN(id)) { alert('Please enter a valid numeric ID.'); return; }
        if (!post) { alert('Please select a post.'); return; }
        if (!status) { alert('Please select a status.'); return; }

        if (editIndex > -1) {
            attendanceData[editIndex] = { name, id, post, status };
            editIndex = -1;
            submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add';
        } else {
            attendanceData.push({ name, id, post, status });
        }

        nameInput.value = '';
        idInput.value = '';
        postSelect.value = '';
        statusSelect.value = 'present';
        renderTable();
    });

    /* -- Edit -- */
    function editStaff(index) {
        const staff = attendanceData[index];
        nameInput.value = staff.name;
        idInput.value = staff.id;
        postSelect.value = staff.post.toLowerCase();
        statusSelect.value = staff.status || 'present';
        editIndex = index;
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Update';
        nameInput.focus();
    }

    /* -- Delete -- */
    function deleteStaff(index) {
        if (!confirm('Are you sure you want to delete this employee?')) return;
        attendanceData.splice(index, 1);
        if (editIndex === index) {
            editIndex = -1;
            nameInput.value = '';
            idInput.value = '';
            postSelect.value = '';
            statusSelect.value = 'present';
            submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add';
        } else if (editIndex > index) {
            editIndex--; // adjust index after splice
        }
        renderTable();
    }

    /* -- Search -- */
    if (searchInput) {
        searchInput.addEventListener('input', renderTable);
    }

    /* -- Preview -- */
    if (previewBtn) {
        previewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (attendanceData.length === 0) {
                alert('No attendance data available to preview.');
                return;
            }
            localStorage.setItem('previewData', JSON.stringify({
                date: dateInput ? dateInput.value : new Date().toISOString().split('T')[0],
                employees: attendanceData
            }));
            window.location.href = 'preview.html';
        });
    }

    /* -- Final Save -- */
    if (finalSaveBtn) {
        finalSaveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (attendanceData.length === 0) {
                alert('No attendance data to save. Please add employees first.');
                return;
            }

            const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
            const records = getAllRecords();

            // Check if a record already exists for this date and replace it
            const existingIdx = records.findIndex(r => r.date === date);
            const newRecord = {
                date: date,
                shift: 'morning',
                employees: attendanceData
            };

            if (existingIdx > -1) {
                records[existingIdx] = newRecord;
            } else {
                records.unshift(newRecord); // newest first
            }

            saveAllRecords(records);
            window.location.href = 'dashboard.html';
        });
    }

    /* -- Export CSV -- */
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            if (attendanceData.length === 0) {
                alert('No data available to export.');
                return;
            }
            const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
            const csv = generateCsv(attendanceData, date);
            downloadFile(csv, 'attendance_' + date + '.csv', 'text/csv');
        });
    }

    /* -- Download PDF (uses browser print) -- */
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', () => {
            if (attendanceData.length === 0) {
                alert('No data available to download.');
                return;
            }
            // Save data for preview, then print from preview
            localStorage.setItem('previewData', JSON.stringify({
                date: dateInput ? dateInput.value : new Date().toISOString().split('T')[0],
                employees: attendanceData
            }));
            // Open preview in new tab and trigger print
            const printWin = window.open('preview.html', '_blank');
            if (printWin) {
                printWin.addEventListener('load', () => {
                    setTimeout(() => { printWin.print(); }, 600);
                });
            }
        });
    }

    // Initial render
    renderTable();
}

/* ============================================================
   3. PREVIEW PAGE
   ============================================================ */

function initPreview() {
    const dataStr = localStorage.getItem('previewData');
    const previewPayload = dataStr ? JSON.parse(dataStr) : null;
    
    console.log(previewPayload);

    const attendanceData = previewPayload ? (previewPayload.employees || []) : [];
    const previewDate = previewPayload ? (previewPayload.date || '') : '';

    // Update the date badge in header
    const dateBadge = document.querySelector('.header-content .badge');
    if (dateBadge && previewDate) {
        dateBadge.textContent = formatDate(previewDate);
    }

    // Update print header date
    const printHeader = document.querySelector('.print-header p');
    if (printHeader && previewDate) {
        printHeader.textContent = 'Daily Attendance Report - Morning Shift (' + formatDate(previewDate) + ')';
    }

    // Group by Post
    const groupedData = {
        incharge: [],
        supervisor: [],
        bouncer: [],
        guard: [],
        driver: []
    };

    attendanceData.forEach(staff => {
        const post = staff.post.toLowerCase();
        if (groupedData[post]) {
            groupedData[post].push(staff);
        }
    });

    let totalStaff = 0;
    let totalPresent = 0;
    let totalAbsent = 0;

    function renderSection(postKey) {
        const sections = Array.from(document.querySelectorAll('section.card'));
        const section = sections.find(sec => {
            const h3 = sec.querySelector('h3');
            return h3 && h3.textContent.toLowerCase().includes(postKey);
        });

        if (!section) return;

        const group = groupedData[postKey] || [];
        const total = group.length;
        
        let presentCount = 0;
        let absentCount = 0;

        group.forEach(staff => {
            if (staff.status === 'absent') absentCount++;
            else presentCount++; // present and halfday count as present/partial present in stats
        });

        totalStaff += total;
        totalPresent += presentCount;
        totalAbsent += absentCount;

        // Update stat boxes
        const statValues = section.querySelectorAll('.stat-value');
        if (statValues.length >= 3) {
            statValues[0].textContent = total;
            statValues[1].textContent = presentCount;
            statValues[2].textContent = absentCount;
        }

        // Update table body
        const tbody = section.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '';

            if (group.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="3" style="text-align: center; color: var(--text-muted);">No data available</td>';
                tbody.appendChild(tr);
            } else {
                group.forEach(staff => {
                    let statusBadge = '';
                    if (staff.status === 'absent') {
                        statusBadge = '<span class="badge badge-danger">Absent</span>';
                    } else if (staff.status === 'halfday') {
                        statusBadge = '<span class="badge badge-warning" style="background: #f59e0b; color: white;">Half Day</span>';
                    } else {
                        statusBadge = '<span class="badge badge-success">Present</span>';
                    }

                    const tr = document.createElement('tr');
                    tr.innerHTML =
                        '<td>' + staff.id + '</td>' +
                        '<td>' + staff.name + '</td>' +
                        '<td style="text-align: right;">' + statusBadge + '</td>';
                    tbody.appendChild(tr);
                });
            }
        }
    }

    renderSection('incharge');
    renderSection('supervisor');
    renderSection('bouncer');
    renderSection('guard');
    renderSection('driver');

    // Update overall summary
    const summaryCard = document.querySelector('.summary-card');
    if (summaryCard) {
        const statValues = summaryCard.querySelectorAll('.stat-value');
        if (statValues.length >= 3) {
            statValues[0].textContent = totalStaff;
            statValues[1].textContent = totalPresent;
            statValues[2].textContent = totalAbsent;
        }
    }

    // --- Add CSV Export button to preview action bar ---
    const actionBarRight = document.querySelector('.action-bar.print-hide .action-bar-right');
    if (actionBarRight && attendanceData.length > 0) {
        const csvBtn = document.createElement('button');
        csvBtn.className = 'btn btn-outline';
        csvBtn.innerHTML = '<i class="fa-solid fa-file-csv"></i> Export CSV';
        // Insert before the print button
        const printBtn = actionBarRight.querySelector('button');
        if (printBtn) {
            actionBarRight.insertBefore(csvBtn, printBtn);
        } else {
            actionBarRight.appendChild(csvBtn);
        }

        csvBtn.addEventListener('click', () => {
            const csv = generateCsv(attendanceData, previewDate);
            downloadFile(csv, 'attendance_' + previewDate + '.csv', 'text/csv');
        });
    }
}
