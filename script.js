// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  const fileBtn = document.getElementById('file-btn');
  const fileInput = document.getElementById('hidden-file-input');
  const fileInfo = document.getElementById('file-info');
  const logTableBody = document.getElementById('log-table-body');
  const dropArea = document.getElementById('drop-area');
  const tableHeaderTitle = document.querySelector('#table-header-div h4');
  const hideControlsToggle = document.getElementById('hide-controls-toggle');
  const toggleSlider = document.getElementById('toggle-slider');
  const sliderKnob = document.getElementById('slider-knob');
  const instructionsDiv = document.getElementById('instructions');
  const dropAreaDiv = document.getElementById('drop-area');
  const selectFileDiv = document.getElementById('select-file');
  const sliderLabel = document.getElementById('slider-label');
  const copyTableBtn = document.getElementById('copy-table-btn');
  const downloadCsvBtn = document.getElementById('download-csv-btn');
  const cookieBanner = document.getElementById('cookie-banner');
  const cookieOkBtn = document.getElementById('cookie-ok-btn');
  const logTableHeader = document.getElementById('log-table-header');
  const logTableHeaderRow = logTableHeader ? logTableHeader.querySelector('tr') : null;
  const logTableHeaderFirstTh = logTableHeaderRow ? logTableHeaderRow.querySelector('th') : null;
  const sortDateCheckbox = document.getElementById('sort-date-checkbox');
  const ipFilterInput = document.getElementById('ip-filter-input');

  // Set initial header text
  if (tableHeaderTitle) {
    tableHeaderTitle.textContent = "Parsed data will be displayed below";
    tableHeaderTitle.style.color = "";
  }

  // Prevent default drag/drop behavior for the whole document
  document.addEventListener('dragover', (e) => {
    /* console.log('Document dragover'); */
    e.preventDefault();
  });
  document.addEventListener('drop', (e) => {
    /* console.log('Document drop'); */
    e.preventDefault();
  });

  // Prevent default click behavior on drop area
  dropArea.addEventListener('click', (e) => {
    console.log('Drop area clicked');
    e.preventDefault();
  });

  // Highlight drop area on dragover
  dropArea.addEventListener('dragover', (e) => {
    /* console.log('Drop area dragover'); */
    e.preventDefault();
    dropArea.classList.add('drag-over');
  });
  dropArea.addEventListener('dragenter', (e) => {
    /* console.log('Drop area dragenter'); */
    e.preventDefault();
    dropArea.classList.add('drag-over');
  });
  dropArea.addEventListener('dragleave', (e) => {
    /* console.log('Drop area dragleave'); */
    dropArea.classList.remove('drag-over');
  });

  // Handle file drop
  dropArea.addEventListener('drop', (e) => {
    /* console.log('Drop area drop'); */
    e.preventDefault();
    dropArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    console.log('Files dropped:', files);
    if (files && files.length > 0) {
      const file = files[0];
      console.log('Processing dropped file:', file.name);
      fileInfo.innerHTML = `Parsed file: ${file.name}`;
      const reader = new FileReader();
      reader.onload = function(ev) {
        /* console.log('FileReader loaded dropped file'); */
        const text = ev.target.result;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const regex = /^(\S+) (\S+) (\S+) \[([^\]:]+):([^\] ]+) ([^\]]+)\] "(\S+) ([^"]+) (\S+)" (\d+) (\d+) "([^"]*)" "([^"]*)" (\d+)? (.*)?$/;
        const anyMatch = lines.some(line => regex.test(line));
        if (tableHeaderTitle) {
          if (anyMatch) {
            tableHeaderTitle.textContent = "Parsed Log Data";
            tableHeaderTitle.style.color = "";
          } else {
            tableHeaderTitle.textContent = "***The selected file is not in the expected format!*** See browser Console for details. (press F12)";
            tableHeaderTitle.style.color = "white";
          }
        }
        parseAndDisplayLogs(text);
      };
      reader.onerror = function(ev) {
        console.error('FileReader error:', ev);
      };
      reader.readAsText(file);
    } else {
      console.log('No files found in drop event');
    }
  });

  // Trigger file input when button is clicked
  fileBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    fileInput.click();
  });

  // Handle file selection
  fileInput.addEventListener('change', () => {
    /* console.log('File input changed'); */
    const file = fileInput.files[0];
    if (file) {
      console.log('Processing selected file:', file.name);
      fileInfo.textContent = `Parsed file: ${file.name}`;
      const reader = new FileReader();
      reader.onload = function(e) {
        /* console.log('FileReader loaded selected file'); */
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const regex = /^(\S+) (\S+) (\S+) \[([^\]:]+):([^\] ]+) ([^\]]+)\] "(\S+) ([^"]+) (\S+)" (\d+) (\d+) "([^"]*)" "([^"]*)" (\d+)? (.*)?$/;
        const anyMatch = lines.some(line => regex.test(line));
        if (tableHeaderTitle) {
          if (anyMatch) {
            tableHeaderTitle.textContent = "Parsed Log Data";
            tableHeaderTitle.style.color = "";
          } else {
            tableHeaderTitle.textContent = "***The selected file is not in the expected format!***";
            tableHeaderTitle.style.color = "white";
          }
        }
        parseAndDisplayLogs(text);
      };
      reader.onerror = function(ev) {
        console.error('FileReader error:', ev);
      };
      reader.readAsText(file);
    } else {
      console.log('No file selected');
    }
  });

  // Helper to show/hide controls
  function setControlsVisibility(hidden) {
    if (instructionsDiv) instructionsDiv.style.display = hidden ? 'none' : '';
    if (dropAreaDiv) dropAreaDiv.style.display = hidden ? 'none' : '';
    if (selectFileDiv) selectFiledDiv.style.display = hidden ? 'none' : '';
    if (sliderLabel) sliderLabel.textContent = hidden ? 'Expand File Selection' : 'Compress File Selection';
  }

  // Reset controls and slider on page load
  setControlsVisibility(false);
  if (hideControlsToggle) hideControlsToggle.style.display = 'none';
  if (toggleSlider) toggleSlider.checked = false;
  if (sliderKnob) sliderKnob.style.left = '2px';

  // Slider toggle logic
  if (toggleSlider) {
    toggleSlider.addEventListener('change', function () {
      setControlsVisibility(this.checked);
      if (sliderKnob) {
        sliderKnob.style.left = this.checked ? '20px' : '2px';
      }
    });
  }

  // Show slider after file is parsed
  function showSlider() {
    if (hideControlsToggle) hideControlsToggle.style.display = '';
  }

  // Show Copy Table and Download CSV buttons when header is "Parsed Log Data"
  function showCopyTableBtn(show) {
    if (copyTableBtn) copyTableBtn.style.display = show ? '' : 'none';
    if (downloadCsvBtn) downloadCsvBtn.style.display = show ? '' : 'none';
  }

  // Helper to get CSV string for visible columns
  function getVisibleTableCsv() {
    const table = document.getElementById('log-table');
    const visibleIndices = getVisibleColumnIndices();
    // Get header row
    const headers = Array.from(table.querySelectorAll('thead th'))
      .filter((th, idx) => visibleIndices.includes(idx))
      .map(th => `"${th.textContent.trim()}"`);
    let csv = headers.join(',') + '\n';
    // Get body rows
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(tr => {
      const cells = Array.from(tr.querySelectorAll('td'))
        .filter((td, idx) => visibleIndices.includes(idx))
        .map(td => `"${td.textContent.trim()}"`);
      csv += cells.join(',') + '\n';
    });
    return csv;
  }

  // Copy table to clipboard as CSV
  if (copyTableBtn) {
    copyTableBtn.addEventListener('click', function () {
      const csv = getVisibleTableCsv();
      // Copy to clipboard (check for API support)
      if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(csv).then(() => {
          copyTableBtn.textContent = "Copied!";
          copyTableBtn.style.background = "#2ecc40"; // green
          setTimeout(() => {
            copyTableBtn.textContent = "Copy Table";
            copyTableBtn.style.background = "#487aed"; // original
          }, 1200);
        }).catch(() => {
          alert("Copy to clipboard failed. Please copy manually.");
        });
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = csv;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          copyTableBtn.textContent = "Copied!";
          copyTableBtn.style.background = "#2ecc40"; // green
          setTimeout(() => {
            copyTableBtn.textContent = "Copy Table";
            copyTableBtn.style.background = "#487aed"; // original
          }, 1200);
        } catch (err) {
          alert("Copy to clipboard failed. Please copy manually.");
        }
        document.body.removeChild(textarea);
      }
    });
  }

  // Download CSV button logic
  if (downloadCsvBtn) {
    downloadCsvBtn.addEventListener('click', function () {
      const csv = getVisibleTableCsv();
      // Get filename from fileInfo
      let baseFilename = "apachelog";
      if (fileInfo && fileInfo.textContent) {
        const match = fileInfo.textContent.match(/Parsed file: ([^\.]+(\.[^\s]+)?)/);
        if (match && match[1]) {
          baseFilename = match[1].replace(/\.[^/.]+$/, ''); // remove extension
        }
      }
      // Get current datetime in YYYYMMDD-HHMMSS
      const now = new Date();
      const pad = n => n.toString().padStart(2, '0');
      const datetime = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const filename = `${baseFilename}-${datetime}.CSV`;

      // Create and trigger download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    });
  }

  // Hide Optional columns logic
  const hideOptionalCheckbox = document.getElementById('hide-optional-checkbox');
  function setOptionalColumnsVisibility(hidden) {
    // Column indices: Identity(1), User ID(2), Referrer(11), Processing Time(13), Custom Metrics(14)
    const indices = [1, 2, 11, 13, 14];
    const userAgentIdx = 12;
    const table = document.getElementById('log-table');
    if (!table) return;
    // Hide/show header cells
    indices.forEach(idx => {
      // Do not hide User Agent column
      if (idx === userAgentIdx) return;
      const th = table.querySelector(`thead th:nth-child(${idx + 1})`);
      if (th) th.style.display = hidden ? 'none' : '';
    });
    // Hide/show body cells
    table.querySelectorAll('tbody tr').forEach(tr => {
      indices.forEach(idx => {
        // Do not hide User Agent column
        if (idx === userAgentIdx) return;
        const td = tr.querySelector(`td:nth-child(${idx + 1})`);
        if (td) td.style.display = hidden ? 'none' : '';
      });
    });
  }
  if (hideOptionalCheckbox) {
    hideOptionalCheckbox.addEventListener('change', function () {
      setOptionalColumnsVisibility(this.checked);
    });
  }
  // Ensure columns are shown on page load
  setOptionalColumnsVisibility(false);

  // Helper: get visible column indices
  function getVisibleColumnIndices() {
    // All columns: 0-14
    // Optional columns: 1,2,11,13,14
    const optional = [1,2,11,13,14];
    if (hideOptionalCheckbox && hideOptionalCheckbox.checked) {
      return Array.from({length: 15}, (_, i) => i).filter(i => !optional.includes(i));
    } else {
      return Array.from({length: 15}, (_, i) => i);
    }
  }

  const filterErrorCheckbox = document.getElementById('filter-error-checkbox');

  function setErrorRowsVisibility(enabled) {
    const table = document.getElementById('log-table');
    if (!table) return;
    // Status Code is column index 9 (10th column)
    table.querySelectorAll('tbody tr').forEach(tr => {
      // Always show all rows if filter is disabled
      if (!enabled) {
        tr.style.display = '';
        return;
      }
      const statusTd = tr.querySelector('td:nth-child(10)');
      if (!statusTd) return;
      const status = statusTd.textContent.trim();
      tr.style.display = (status.startsWith('4') || status.startsWith('5')) ? '' : 'none';
    });
  }

  let lastParsedLogText = ""; // Store last parsed log text

  // Update file parsing to store the log text
  function parseAndDisplayLogs(logText) {
    lastParsedLogText = logText; // Save for future re-parsing
    logTableBody.innerHTML = ''; // Clear previous rows
    const lines = logText.split('\n').filter(line => line.trim() !== '');

    // Collect parsed rows as objects for sorting
    let parsedRows = [];

    console.log(
      `Number of lines: %c${lines.length}`,
      'color: #0074D9; font-weight: bold;'
    );

    let matchedCount = 0;
    let notMatchedCount = 0;

    lines.forEach((line, idx) => {
      // Reasoning:
      // Previous regexes failed because they required three quoted fields after the request.
      // The example line only has two quoted fields ("Referrer" and "User Agent").
      // Solution: Use a regex that matches two quoted fields after the request, and optionally matches a space and two trailing fields.
      // This covers all standard Apache log lines, including those with only two quoted fields after the request.

      const regex = /^((?:\d{1,3}\.){3}\d{1,3}|[a-fA-F0-9:]+) (\S+) (\S+) \[([^\]:]+):([^\] ]+) ([^\]]+)\] "(\S+) ([^"]+) (\S+)" (\d{3}) ([\d-]+) "([^"]*)" "([^"]*)"(?: (\d+))?(?: (.*))?$/;

      let match = line.match(regex);

      // If not matched, try a version that ends after User Agent (no trailing fields)
      if (!match) {
        match = line.match(/^((?:\d{1,3}\.){3}\d{1,3}|[a-fA-F0-9:]+) (\S+) (\S+) \[([^\]:]+):([^\] ]+) ([^\]]+)\] "(\S+) ([^"]+) (\S+)" (\d{3}) ([\d-]+) "([^"]*)" "([^"]*)"$/);
        if (match) {
          match[14] = ""; // processingTime
          match[15] = ""; // customMetrics
        }
      }

      if (match) {
        matchedCount++;

        const [
          _, ip, identity, userid, date, time, utcOffset,
          method, fileRequested, protocol, status, size,
          referrer, userAgent, processingTime, customMetrics
        ] = match;

        const procTime = typeof processingTime === "undefined" ? "" : processingTime;
        const custMetrics = typeof customMetrics === "undefined" ? "" : customMetrics;

        const normalize = val => val === '-' ? '' : val;

        let formattedDate = date;
        const dateRegex = /^(\d{2})\/([A-Za-z]{3})\/(\d{4})$/;
        const dateMatch = date.match(dateRegex);
        if (dateMatch) {
          formattedDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
        }

        // For sorting, create a JS Date object from date and time
        // Example: 17-May-2015 10:05:03 +0000
        let sortableDate = null;
        if (dateMatch) {
          // Convert month abbreviation to number
          const monthMap = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
          const day = parseInt(dateMatch[1], 10);
          const month = monthMap[dateMatch[2]];
          const year = parseInt(dateMatch[3], 10);
          const [hh, mm, ss] = time.split(':').map(Number);
          sortableDate = new Date(Date.UTC(year, month, day, hh, mm, ss));
        }

        const allColumns = [
          normalize(ip),              // 0 IP Address
          normalize(identity),        // 1 Identity
          normalize(userid),          // 2 User ID
          formattedDate,              // 3 Date
          time,                       // 4 Time
          utcOffset,                  // 5 UTC Offset
          normalize(method),          // 6 HTTP Method
          normalize(fileRequested),   // 7 Requested File
          normalize(protocol),        // 8 Protocol
          status,                     // 9 Status Code
          size,                       // 10 Response Size
          normalize(referrer),        // 11 Referrer
          normalize(userAgent),       // 12 User Agent
          procTime,                   // 13 Processing Time
          custMetrics                 // 14 Custom Metrics
        ];

        // Filter on Errors: only add if status starts with 4 or 5
        const filterErrors = filterErrorCheckbox && filterErrorCheckbox.checked;
        if (filterErrors && !(status.startsWith('4') || status.startsWith('5'))) {
          return; // skip non-error rows
        }

        parsedRows.push({
          columns: allColumns,
          sortableDate: sortableDate || new Date(0), // fallback to epoch if not parsed
        });
      } else {
        notMatchedCount++;
        // Check for possible idle browser session pattern
        const idlePattern = /^(\S+) (\S+) (\S+) \[([^\]:]+):([^\] ]+) ([^\]]+)\] "-" 408 0 "-" "-"/;
        if (idlePattern.test(line)) {
          console.log(`Line ${idx + 1} did not match regex: . Possible idle browser session.`, line);
        } else {
          console.log(`Line ${idx + 1} did not match regex:`, line);
        }
      }
    });

    // IP Filter logic
    let ipFilterValue = ipFilterInput ? ipFilterInput.value.trim() : "";
    if (ipFilterValue.length > 0) {
      // Replace * and % with .*
      let pattern = ipFilterValue.replace(/(\*|%)/g, '.*');
      // Escape other regex special chars except . and *
      pattern = pattern.replace(/([+?^=!:${}()|\[\]\/\\])/g, '\\$1');
      // Always match from start
      const ipRegex = new RegExp('^' + pattern);
      parsedRows = parsedRows.filter(rowObj => ipRegex.test(rowObj.columns[0]));
    }

    // Sort rows by date if option is checked
    if (sortDateCheckbox && sortDateCheckbox.checked) {
      parsedRows.sort((a, b) => b.sortableDate - a.sortableDate); // Descending: newest first
    } else {
      parsedRows.sort((a, b) => a.sortableDate - b.sortableDate); // Ascending: oldest first
    }

    // Render sorted rows
    parsedRows.forEach(rowObj => {
      const allColumns = rowObj.columns;
      const optional = [1,2,11,13,14];
      const hideOptional = hideOptionalCheckbox && hideOptionalCheckbox.checked;
      const row = document.createElement('tr');
      allColumns.forEach((val, i) => {
        const td = document.createElement('td');
        td.textContent = val;
        if (i === 12) td.classList.add('user-agent-col');
        if (hideOptional && optional.includes(i)) td.style.display = 'none';
        row.appendChild(td);
      });
      logTableBody.appendChild(row);
    });

    // Print summary with colored numbers
    console.log(
      `Summary: %c${matchedCount}%c lines matched, %c${notMatchedCount}%c lines did not match.`,
      'color: #0074D9; font-weight: bold;',
      'color: inherit;',
      'color: #0074D9; font-weight: bold;',
      'color: inherit;'
    );

    showSlider();

    // Always set header and Copy Table button visibility based on matchedCount
    if (tableHeaderTitle) {
      if (matchedCount === 0) {
        tableHeaderTitle.textContent = "0 lines matched the format!";
        showCopyTableBtn(false);
      } else {
        tableHeaderTitle.textContent = "Parsed Log Data";
        showCopyTableBtn(true);
      }
    }

    // Always update fileInfo for 0 matched lines
    if (fileInfo) {
      if (matchedCount === 0) {
        fileInfo.innerHTML = "<span style='color:#487aed;font-weight:bold;'>No lines in the file matched the expected format. Please check your file and see the console log for details.</span>";
      } else if (fileInfo.innerHTML.startsWith("Parsed file:")) {
        if (notMatchedCount > 0) {
          fileInfo.innerHTML += `. ${notMatchedCount} lines in the file not added to table. See console log.`;
        }
      }
    }

    // After parsing, ensure column visibility matches checkbox
    setOptionalColumnsVisibility(hideOptionalCheckbox && hideOptionalCheckbox.checked);
    setErrorRowsVisibility(filterErrorCheckbox && filterErrorCheckbox.checked);
  }

  function setCookie(name, value, days = 365) {
    const expires = new Date(Date.now() + days*24*60*60*1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  }
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function showCookieBannerIfNeeded() {
    if (!getCookie('cookieAccepted')) {
      cookieBanner.style.display = '';
    }
  }
  if (cookieOkBtn) {
    cookieOkBtn.onclick = function() {
      setCookie('cookieAccepted', 'true');
      cookieBanner.style.display = 'none';
    };
  }
  showCookieBannerIfNeeded();

  // Settings dropdown toggle logic
  const settingsCog = document.getElementById('settings-cog');
  const settingsDropdown = document.getElementById('settings-dropdown');
  if (settingsCog && settingsDropdown) {
    settingsCog.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsDropdown.style.display = (settingsDropdown.style.display === 'none' || settingsDropdown.style.display === '') ? 'block' : 'none';
    });
    document.addEventListener('click', (e) => {
      if (!settingsDropdown.contains(e.target) && e.target !== settingsCog) {
        settingsDropdown.style.display = 'none';
      }
    });
  }

  if (filterErrorCheckbox) {
    filterErrorCheckbox.addEventListener('change', function () {
      // Instead of just toggling row visibility, re-parse and re-render the table
      parseAndDisplayLogs(lastParsedLogText);
    });
  }

  // Sticky header border logic
  function updateTableHeaderBorder() {
    if (!logTableHeaderRow) return;
    const rect = logTableHeader.getBoundingClientRect();
    if (rect.top > 0) {
      // Header is NOT at the top, show white border across all th
      logTableHeaderRow.classList.add('thead-top-border');
    } else {
      // Header is at the top, remove border
      logTableHeaderRow.classList.remove('thead-top-border');
    }
  }
  // Initial state
  updateTableHeaderBorder();
  window.addEventListener('scroll', updateTableHeaderBorder, { passive: true });
  window.addEventListener('resize', updateTableHeaderBorder, { passive: true });

  if (sortDateCheckbox) {
    sortDateCheckbox.addEventListener('change', function () {
      // Re-parse and re-render table with new sort order
      parseAndDisplayLogs(lastParsedLogText);
    });
  }

  // IP Filter live update
  if (ipFilterInput) {
    ipFilterInput.addEventListener('input', function () {
      parseAndDisplayLogs(lastParsedLogText);
    });
  }
});


