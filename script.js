document.addEventListener('DOMContentLoaded', () => {
  const HIDDEN_CLASS = 'is-hidden';
  const COLUMN_HIDDEN_CLASS = 'is-column-hidden';
  const ROW_HIDDEN_CLASS = 'is-row-hidden';
  const SUCCESS_CLASS = 'is-success';
  const ERROR_CLASS = 'has-error';
  const IP_ADDRESS_PATTERN = '((?:\\d{1,3}\\.){3}\\d{1,3}|[a-fA-F0-9:]+)';
  const ESCAPED_QUOTED_FIELD_PATTERN = '"((?:[^"\\\\]|\\\\.)*)"';
  const APACHE_LOG_PATTERN = new RegExp(
    `^${IP_ADDRESS_PATTERN} (\\S+) (\\S+) \\[([^\\]:]+):([^\\] ]+) ([^\\]]+)\\] "(\\S+) ([^"]+) (\\S+)" (\\d{3}) ([\\d-]+) ${ESCAPED_QUOTED_FIELD_PATTERN} ${ESCAPED_QUOTED_FIELD_PATTERN}(?: (\\d+))?(?: (.*))?$`
  );
  const APACHE_LOG_PATTERN_NO_TRAILING = new RegExp(
    `^${IP_ADDRESS_PATTERN} (\\S+) (\\S+) \\[([^\\]:]+):([^\\] ]+) ([^\\]]+)\\] "(\\S+) ([^"]+) (\\S+)" (\\d{3}) ([\\d-]+) ${ESCAPED_QUOTED_FIELD_PATTERN} ${ESCAPED_QUOTED_FIELD_PATTERN}$`
  );

  const fileBtn = document.getElementById('file-btn');
  const fileInput = document.getElementById('hidden-file-input');
  const fileInfo = document.getElementById('file-info');
  const logTableBody = document.getElementById('log-table-body');
  const dropArea = document.getElementById('drop-area');
  const tableHeaderTitle = document.getElementById('parsed-header-title');
  const hideControlsToggle = document.getElementById('hide-controls-toggle');
  const toggleSlider = document.getElementById('toggle-slider');
  const instructionsDiv = document.getElementById('instructions');
  const dropAreaDiv = document.getElementById('drop-area');
  const selectFileDiv = document.getElementById('selectFile');
  const sliderLabel = document.getElementById('slider-label');
  const copyTableBtn = document.getElementById('copy-table-btn');
  const downloadCsvBtn = document.getElementById('download-csv-btn');
  const cookieBanner = document.getElementById('cookie-banner');
  const cookieOkBtn = document.getElementById('cookie-ok-btn');
  const logTableHeader = document.getElementById('log-table-header');
  const logTableHeaderRow = logTableHeader ? logTableHeader.querySelector('tr') : null;
  const tableScrollContainer = document.getElementById('table-scroll-container');
  const sortDateCheckbox = document.getElementById('sort-date-checkbox');
  const ipFilterInput = document.getElementById('ip-filter-input');
  const hideOptionalCheckbox = document.getElementById('hide-optional-checkbox');
  const filterErrorCheckbox = document.getElementById('filter-error-checkbox');
  const settingsCog = document.getElementById('settings-cog');
  const settingsDropdown = document.getElementById('settings-dropdown');
  const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');
  const themeToggleCopy = document.getElementById('theme-toggle-copy');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  let lastParsedLogText = '';
  let lastParsedFilename = '';

  function applyTheme(theme, persist = false) {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    document.body.dataset.theme = nextTheme;

    if (themeToggleCheckbox) {
      themeToggleCheckbox.checked = nextTheme === 'dark';
      themeToggleCheckbox.setAttribute('aria-checked', String(nextTheme === 'dark'));
    }

    if (themeToggleCopy) {
      themeToggleCopy.textContent = nextTheme === 'dark' ? 'Dark mode active' : 'Light mode active';
    }

    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', nextTheme === 'dark' ? '#14111d' : '#f2eef8');
    }

    if (persist) {
      setCookie('themePreference', nextTheme);
    }
  }

  function unescapeQuotedField(value) {
    return value.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }

  function matchApacheLogLine(line) {
    let match = line.match(APACHE_LOG_PATTERN);

    if (!match) {
      match = line.match(APACHE_LOG_PATTERN_NO_TRAILING);
      if (match) {
        match[14] = '';
        match[15] = '';
      }
    }

    return match;
  }

  function setHidden(element, hidden) {
    if (element) {
      element.classList.toggle(HIDDEN_CLASS, hidden);
    }
  }

  function setHeaderState(text, isError = false) {
    if (!tableHeaderTitle) {
      return;
    }

    tableHeaderTitle.textContent = text;
    tableHeaderTitle.classList.toggle(ERROR_CLASS, isError);
  }

  function flashCopySuccess() {
    if (!copyTableBtn) {
      return;
    }

    copyTableBtn.textContent = 'Copied!';
    copyTableBtn.classList.add(SUCCESS_CLASS);

    setTimeout(() => {
      copyTableBtn.textContent = 'Copy Table';
      copyTableBtn.classList.remove(SUCCESS_CLASS);
    }, 1200);
  }

  setHeaderState('Parsed data will be displayed below');

  document.addEventListener('dragover', (event) => {
    event.preventDefault();
  });

  document.addEventListener('drop', (event) => {
    event.preventDefault();
  });

  if (dropArea) {
    dropArea.addEventListener('click', (event) => {
      event.preventDefault();
    });

    dropArea.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropArea.classList.add('drag-over');
    });

    dropArea.addEventListener('dragenter', (event) => {
      event.preventDefault();
      dropArea.classList.add('drag-over');
    });

    dropArea.addEventListener('dragleave', () => {
      dropArea.classList.remove('drag-over');
    });

    dropArea.addEventListener('drop', (event) => {
      event.preventDefault();
      dropArea.classList.remove('drag-over');

      const files = event.dataTransfer ? event.dataTransfer.files : null;
      if (files && files.length > 0) {
        readLogFile(files[0], '***The selected file is not in the expected format!*** See browser Console for details. (press F12)');
      }
    });
  }

  if (fileBtn && fileInput) {
    fileBtn.addEventListener('mousedown', (event) => {
      event.preventDefault();
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files ? fileInput.files[0] : null;
      if (file) {
        readLogFile(file, '***The selected file is not in the expected format!***');
      }
    });
  }

  function readLogFile(file, invalidMessage) {
    if (!file || !fileInfo) {
      return;
    }

    lastParsedFilename = file.name;
    fileInfo.textContent = `Parsed file: ${file.name}`;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target ? event.target.result : '';
      const lines = String(text).split('\n').filter(line => line.trim() !== '');
      const anyMatch = lines.some(line => Boolean(matchApacheLogLine(line)));

      if (anyMatch) {
        setHeaderState('Parsed Log Data');
      } else {
        setHeaderState(invalidMessage, true);
      }

      parseAndDisplayLogs(String(text));
    };

    reader.onerror = (event) => {
      console.error('FileReader error:', event);
    };

    reader.readAsText(file);
  }

  function setControlsVisibility(hidden) {
    setHidden(instructionsDiv, hidden);
    setHidden(dropAreaDiv, hidden);
    setHidden(selectFileDiv, hidden);

    if (sliderLabel) {
      sliderLabel.textContent = hidden ? 'Expand File Selection' : 'Compress File Selection';
    }
  }

  setControlsVisibility(false);
  setHidden(hideControlsToggle, true);
  if (toggleSlider) {
    toggleSlider.checked = false;
    toggleSlider.addEventListener('change', function () {
      setControlsVisibility(this.checked);
    });
  }

  function showSlider() {
    setHidden(hideControlsToggle, false);
  }

  function showCopyTableBtn(show) {
    setHidden(copyTableBtn, !show);
    setHidden(downloadCsvBtn, !show);
  }

  function getVisibleColumnIndices() {
    const optional = [1, 2, 11, 13, 14];
    if (hideOptionalCheckbox && hideOptionalCheckbox.checked) {
      return Array.from({ length: 15 }, (_, index) => index).filter(index => !optional.includes(index));
    }

    return Array.from({ length: 15 }, (_, index) => index);
  }

  function getVisibleTableCsv() {
    const table = document.getElementById('log-table');
    if (!table) {
      return '';
    }

    const visibleIndices = getVisibleColumnIndices();
    const headers = Array.from(table.querySelectorAll('thead th'))
      .filter((th, index) => visibleIndices.includes(index))
      .map(th => `"${th.textContent.trim()}"`);

    let csv = `${headers.join(',')}\n`;
    const rows = table.querySelectorAll('tbody tr');

    rows.forEach((tableRow) => {
      if (tableRow.classList.contains(ROW_HIDDEN_CLASS)) {
        return;
      }

      const cells = Array.from(tableRow.querySelectorAll('td'))
        .filter((td, index) => visibleIndices.includes(index))
        .map(td => `"${td.textContent.trim()}"`);

      csv += `${cells.join(',')}\n`;
    });

    return csv;
  }

  if (copyTableBtn) {
    copyTableBtn.addEventListener('click', () => {
      const csv = getVisibleTableCsv();
      if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(csv).then(() => {
          flashCopySuccess();
        }).catch(() => {
          alert('Copy to clipboard failed. Please copy manually.');
        });
        return;
      }

      const textarea = document.createElement('textarea');
      textarea.value = csv;
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand('copy');
        flashCopySuccess();
      } catch (error) {
        alert('Copy to clipboard failed. Please copy manually.');
      }

      document.body.removeChild(textarea);
    });
  }

  if (downloadCsvBtn) {
    downloadCsvBtn.addEventListener('click', () => {
      const csv = getVisibleTableCsv();
      let baseFilename = 'apachelog';

      if (lastParsedFilename) {
        baseFilename = lastParsedFilename.replace(/\.[^/.]+$/, '');
      }

      const now = new Date();
      const pad = (value) => value.toString().padStart(2, '0');
      const datetime = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const filename = `${baseFilename}-${datetime}.CSV`;

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    });
  }

  function setOptionalColumnsVisibility(hidden) {
    const indices = [1, 2, 11, 13, 14];
    const table = document.getElementById('log-table');
    if (!table) {
      return;
    }

    indices.forEach((index) => {
      const headerCell = table.querySelector(`thead th:nth-child(${index + 1})`);
      if (headerCell) {
        headerCell.classList.toggle(COLUMN_HIDDEN_CLASS, hidden);
      }
    });

    table.querySelectorAll('tbody tr').forEach((tableRow) => {
      indices.forEach((index) => {
        const bodyCell = tableRow.querySelector(`td:nth-child(${index + 1})`);
        if (bodyCell) {
          bodyCell.classList.toggle(COLUMN_HIDDEN_CLASS, hidden);
        }
      });
    });
  }

  function setErrorRowsVisibility(enabled) {
    const table = document.getElementById('log-table');
    if (!table) {
      return;
    }

    table.querySelectorAll('tbody tr').forEach((tableRow) => {
      if (!enabled) {
        tableRow.classList.remove(ROW_HIDDEN_CLASS);
        return;
      }

      const statusCell = tableRow.querySelector('td:nth-child(10)');
      if (!statusCell) {
        return;
      }

      const status = statusCell.textContent.trim();
      tableRow.classList.toggle(ROW_HIDDEN_CLASS, !(status.startsWith('4') || status.startsWith('5')));
    });
  }

  setOptionalColumnsVisibility(false);

  function parseAndDisplayLogs(logText) {
    lastParsedLogText = logText;
    if (!logTableBody) {
      return;
    }

    logTableBody.innerHTML = '';
    const lines = logText.split('\n').filter(line => line.trim() !== '');
    let parsedRows = [];

    console.log(
      `Number of lines: %c${lines.length}`,
      'color: #0074D9; font-weight: bold;'
    );

    let matchedCount = 0;
    let notMatchedCount = 0;

    lines.forEach((line, index) => {
      const match = matchApacheLogLine(line);

      if (!match) {
        notMatchedCount++;
        const idlePattern = /^(\S+) (\S+) (\S+) \[([^\]:]+):([^\] ]+) ([^\]]+)\] "-" 408 0 "-" "-"/;
        if (idlePattern.test(line)) {
          console.log(`Line ${index + 1} did not match regex: . Possible idle browser session.`, line);
        } else {
          console.log(`Line ${index + 1} did not match regex:`, line);
        }
        return;
      }

      matchedCount++;

      const [
        , ip, identity, userid, date, time, utcOffset,
        method, fileRequested, protocol, status, size,
        referrer, userAgent, processingTime, customMetrics,
      ] = match;

      const normalize = (value) => value === '-' ? '' : value;
      const procTime = typeof processingTime === 'undefined' ? '' : processingTime;
      const custMetrics = typeof customMetrics === 'undefined' ? '' : customMetrics;

      let formattedDate = date;
      const dateRegex = /^(\d{2})\/([A-Za-z]{3})\/(\d{4})$/;
      const dateMatch = date.match(dateRegex);
      if (dateMatch) {
        formattedDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      }

      let sortableDate = null;
      if (dateMatch) {
        const monthMap = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
        const day = parseInt(dateMatch[1], 10);
        const month = monthMap[dateMatch[2]];
        const year = parseInt(dateMatch[3], 10);
        const [hours, minutes, seconds] = time.split(':').map(Number);
        sortableDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
      }

      const allColumns = [
        normalize(ip),
        normalize(identity),
        normalize(userid),
        formattedDate,
        time,
        utcOffset,
        normalize(method),
        normalize(fileRequested),
        normalize(protocol),
        status,
        size,
        normalize(unescapeQuotedField(referrer)),
        normalize(unescapeQuotedField(userAgent)),
        procTime,
        custMetrics,
      ];

      const filterErrors = filterErrorCheckbox && filterErrorCheckbox.checked;
      if (filterErrors && !(status.startsWith('4') || status.startsWith('5'))) {
        return;
      }

      parsedRows.push({
        columns: allColumns,
        sortableDate: sortableDate || new Date(0),
      });
    });

    const ipFilterValue = ipFilterInput ? ipFilterInput.value.trim() : '';
    if (ipFilterValue.length > 0) {
      let pattern = ipFilterValue.replace(/(\*|%)/g, '.*');
      pattern = pattern.replace(/([+?^=!:${}()|\[\]\/\\])/g, '\\$1');
      const ipRegex = new RegExp(`^${pattern}`);
      parsedRows = parsedRows.filter(rowObject => ipRegex.test(rowObject.columns[0]));
    }

    if (sortDateCheckbox && sortDateCheckbox.checked) {
      parsedRows.sort((left, right) => right.sortableDate - left.sortableDate);
    } else {
      parsedRows.sort((left, right) => left.sortableDate - right.sortableDate);
    }

    parsedRows.forEach((rowObject) => {
      const optionalColumns = [1, 2, 11, 13, 14];
      const hideOptional = hideOptionalCheckbox && hideOptionalCheckbox.checked;
      const row = document.createElement('tr');

      rowObject.columns.forEach((value, columnIndex) => {
        const cell = document.createElement('td');
        cell.textContent = value;

        if (columnIndex === 12) {
          cell.classList.add('user-agent-col');
        }

        if (hideOptional && optionalColumns.includes(columnIndex)) {
          cell.classList.add(COLUMN_HIDDEN_CLASS);
        }

        row.appendChild(cell);
      });

      logTableBody.appendChild(row);
    });

    console.log(
      `Summary: %c${matchedCount}%c lines matched, %c${notMatchedCount}%c lines did not match.`,
      'color: #0074D9; font-weight: bold;',
      'color: inherit;',
      'color: #0074D9; font-weight: bold;',
      'color: inherit;'
    );

    showSlider();

    if (matchedCount === 0) {
      setHeaderState('0 lines matched the format!');
      showCopyTableBtn(false);
    } else {
      setHeaderState('Parsed Log Data');
      showCopyTableBtn(true);
    }

    if (fileInfo) {
      if (matchedCount === 0) {
        fileInfo.textContent = 'No lines in the file matched the expected format. Please check your file and see the console log for details.';
      } else if (lastParsedFilename) {
        let message = `Parsed file: ${lastParsedFilename}`;
        if (notMatchedCount > 0) {
          message += `. ${notMatchedCount} lines in the file not added to table. See console log.`;
        }
        fileInfo.textContent = message;
      }
    }

    setOptionalColumnsVisibility(Boolean(hideOptionalCheckbox && hideOptionalCheckbox.checked));
    setErrorRowsVisibility(Boolean(filterErrorCheckbox && filterErrorCheckbox.checked));
  }

  function setCookie(name, value, days = 365) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  }

  function getCookie(name) {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function getCookieBoolean(name, defaultValue = false) {
    const value = getCookie(name);
    if (value === null) {
      return defaultValue;
    }

    return value === 'true';
  }

  if (hideOptionalCheckbox) {
    hideOptionalCheckbox.checked = getCookieBoolean('hideOptionalPreference');
  }

  if (filterErrorCheckbox) {
    filterErrorCheckbox.checked = getCookieBoolean('filterErrorPreference');
  }

  if (sortDateCheckbox) {
    sortDateCheckbox.checked = getCookieBoolean('sortDatePreference');
  }

  applyTheme(getCookie('themePreference') || 'light');
  setOptionalColumnsVisibility(Boolean(hideOptionalCheckbox && hideOptionalCheckbox.checked));
  setErrorRowsVisibility(Boolean(filterErrorCheckbox && filterErrorCheckbox.checked));

  function showCookieBannerIfNeeded() {
    if (!getCookie('cookieAccepted')) {
      setHidden(cookieBanner, false);
    }
  }

  if (cookieOkBtn) {
    cookieOkBtn.addEventListener('click', () => {
      setCookie('cookieAccepted', 'true');
      setHidden(cookieBanner, true);
    });
  }

  if (themeToggleCheckbox) {
    themeToggleCheckbox.addEventListener('change', function () {
      applyTheme(this.checked ? 'dark' : 'light', true);
    });
  }

  showCookieBannerIfNeeded();

  if (settingsCog && settingsDropdown) {
    settingsCog.addEventListener('click', (event) => {
      event.stopPropagation();
      settingsDropdown.classList.toggle(HIDDEN_CLASS);
    });

    document.addEventListener('click', (event) => {
      if (!settingsDropdown.contains(event.target) && event.target !== settingsCog) {
        settingsDropdown.classList.add(HIDDEN_CLASS);
      }
    });
  }

  if (hideOptionalCheckbox) {
    hideOptionalCheckbox.addEventListener('change', function () {
      setCookie('hideOptionalPreference', String(this.checked));
      setOptionalColumnsVisibility(this.checked);
    });
  }

  if (filterErrorCheckbox) {
    filterErrorCheckbox.addEventListener('change', () => {
      setCookie('filterErrorPreference', String(filterErrorCheckbox.checked));
      parseAndDisplayLogs(lastParsedLogText);
    });
  }

  function updateTableHeaderBorder() {
    if (!logTableHeader || !logTableHeaderRow) {
      return;
    }

    const rect = logTableHeader.getBoundingClientRect();
    logTableHeaderRow.classList.toggle('thead-top-border', rect.top > 0);
  }

  updateTableHeaderBorder();
  window.addEventListener('scroll', updateTableHeaderBorder, { passive: true });
  window.addEventListener('resize', updateTableHeaderBorder, { passive: true });
  if (tableScrollContainer) {
    tableScrollContainer.addEventListener('scroll', updateTableHeaderBorder, { passive: true });
  }

  if (sortDateCheckbox) {
    sortDateCheckbox.addEventListener('change', () => {
      setCookie('sortDatePreference', String(sortDateCheckbox.checked));
      parseAndDisplayLogs(lastParsedLogText);
    });
  }

  if (ipFilterInput) {
    ipFilterInput.addEventListener('input', () => {
      parseAndDisplayLogs(lastParsedLogText);
    });
  }
});


