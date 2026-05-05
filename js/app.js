document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today for date pickers
    const datePickers = document.querySelectorAll('input[type="date"]');
    if (datePickers.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        datePickers.forEach(picker => {
            if (!picker.value) {
                picker.value = today;
            }
        });
    }

    // Auto-focus first input on login
    const loginInput = document.getElementById('username');
    if (loginInput) {
        loginInput.focus();
    }

    // Identify current page based on elements
    if (document.getElementById('staff-name') && document.getElementById('staff-id')) {
        initAddAttendance();
    } else if (document.querySelector('.preview-stats')) {
        initPreview();
    }
});

function initAddAttendance() {
    const form = document.querySelector('form.form-grid');
    const nameInput = document.getElementById('staff-name');
    const idInput = document.getElementById('staff-id');
    const postSelect = document.getElementById('staff-post');
    const submitBtn = form.querySelector('button[type="submit"]');
    const tbody = document.querySelector('.table-responsive tbody');
    const searchInput = document.querySelector('.action-bar-left input[type="text"]');
    
    const previewBtn = document.querySelector('a[href="preview.html"]');
    const exportCsvBtn = Array.from(document.querySelectorAll('button.btn-outline')).find(b => b.textContent.includes('Export CSV'));

    let attendanceData = [];
    let editIndex = -1;

    // Scrape initial data from the existing hardcoded table so we don't lose it
    Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length === 5) {
            const name = tds[1].textContent.trim();
            const id = tds[2].textContent.trim();
            const post = tds[3].textContent.trim();
            attendanceData.push({ name, id, post });
        }
    });

    function renderTable() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        tbody.innerHTML = '';
        
        let serial = 1;
        attendanceData.forEach((staff, index) => {
            if (staff.name.toLowerCase().includes(searchTerm) || staff.id.toLowerCase().includes(searchTerm)) {
                
                let iconClass = 'fa-user';
                const postLower = staff.post.toLowerCase();
                if (postLower === 'guard') iconClass = 'fa-user-shield';
                else if (postLower === 'supervisor') iconClass = 'fa-clipboard-user';
                else if (postLower === 'bouncer') iconClass = 'fa-user-ninja';
                else if (postLower === 'incharge') iconClass = 'fa-user-tie';
                else if (postLower === 'driver') iconClass = 'fa-car';

                // Capitalize first letter of post
                const displayPost = staff.post.charAt(0).toUpperCase() + staff.post.slice(1);

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${serial++}</td>
                    <td><i class="fa-solid ${iconClass}" style="color: var(--text-muted); margin-right: 8px;"></i> ${staff.name}</td>
                    <td>${staff.id}</td>
                    <td>${displayPost}</td>
                    <td style="text-align: right;">
                        <div class="flex justify-end gap-2">
                            <button type="button" class="btn btn-outline btn-icon edit-btn" data-index="${index}" title="Edit">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button type="button" class="btn btn-danger btn-icon delete-btn" data-index="${index}" title="Delete">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            }
        });

        // Attach event listeners for edit and delete
        tbody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.getAttribute('data-index'));
                editStaff(index);
            });
        });

        tbody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.getAttribute('data-index'));
                deleteStaff(index);
            });
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = nameInput.value.trim();
        const id = idInput.value.trim();
        const post = postSelect.value;

        if (!name) {
            alert('Please enter a name.');
            return;
        }
        if (!id || isNaN(id)) {
            alert('Please enter a valid numeric ID.');
            return;
        }
        if (!post) {
            alert('Please select a post.');
            return;
        }

        if (editIndex > -1) {
            attendanceData[editIndex] = { name, id, post };
            editIndex = -1;
            submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add';
        } else {
            attendanceData.push({ name, id, post });
        }

        nameInput.value = '';
        idInput.value = '';
        postSelect.value = '';
        
        renderTable();
    });

    function editStaff(index) {
        const staff = attendanceData[index];
        nameInput.value = staff.name;
        idInput.value = staff.id;
        postSelect.value = staff.post.toLowerCase();
        
        editIndex = index;
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Update';
    }

    function deleteStaff(index) {
        if (confirm('Are you sure you want to delete this employee?')) {
            attendanceData.splice(index, 1);
            if (editIndex === index) {
                editIndex = -1;
                nameInput.value = '';
                idInput.value = '';
                postSelect.value = '';
                submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add';
            }
            renderTable();
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', renderTable);
    }

    if (previewBtn) {
        previewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (attendanceData.length === 0) {
                alert('No attendance data available to preview.');
                return;
            }
            localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
            window.location.href = previewBtn.getAttribute('href');
        });
    }

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            if (attendanceData.length === 0) {
                alert('No data available to export.');
                return;
            }
            let csv = 'Serial Number,Name,ID,Post\n';
            attendanceData.forEach((staff, index) => {
                csv += `${index + 1},"${staff.name}",${staff.id},${staff.post}\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'attendance.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    // Initial render
    renderTable();
}

function initPreview() {
    const dataStr = localStorage.getItem('attendanceData');
    if (!dataStr) {
        alert('No attendance data found. Please add attendance first.');
        return;
    }

    const attendanceData = JSON.parse(dataStr);
    
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
        } else {
            // Fallback just in case
            groupedData['guard'] = groupedData['guard'] || [];
            groupedData['guard'].push(staff);
        }
    });

    let totalStaff = 0;
    let totalPresent = 0;
    let totalAbsent = 0;

    // Helper to render section
    function renderSection(postKey) {
        // Find the section by matching h3 text
        const sections = Array.from(document.querySelectorAll('section.card'));
        const section = sections.find(sec => {
            const h3 = sec.querySelector('h3');
            return h3 && h3.textContent.toLowerCase().includes(postKey);
        });

        if (!section) return;

        const group = groupedData[postKey] || [];
        const total = group.length;
        const present = total; // All added are considered present
        const absent = 0;

        totalStaff += total;
        totalPresent += present;
        totalAbsent += absent;

        // Update stats
        const statValues = section.querySelectorAll('.stat-value');
        if (statValues.length >= 3) {
            statValues[0].textContent = total;
            statValues[1].textContent = present;
            statValues[2].textContent = absent;
        }

        // Update table
        const tbody = section.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '';
            
            if (group.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="3" style="text-align: center; color: var(--text-muted);">No ${postKey}s present.</td>`;
                tbody.appendChild(tr);
            } else {
                group.forEach(staff => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${staff.id}</td>
                        <td>${staff.name}</td>
                        <td style="text-align: right;"><span class="badge badge-success">Present</span></td>
                    `;
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
}
