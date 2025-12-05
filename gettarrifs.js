/**
 * Логика для экспорта и импорта тарифов в CSV
 */

(function() {
  'use strict';

  // Проверяем, находимся ли мы на странице тарифов
  function isTariffPage() {
    const path = window.location.pathname;
    return path.includes('/tariff/') || path.includes('/tariff');
  }

  // Получаем type_group_id из URL или формы
  function getTypeGroupId() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) return id;
    
    const form = document.querySelector('#editTimePeriodModal form');
    if (form) {
      const input = form.querySelector('input[name="type_group_id"]');
      if (input) return input.value;
    }
    
    if (typeof typeGroupId !== 'undefined') {
      return typeGroupId;
    }
    
    return null;
  }

  // Получаем название пакета
  function getPackageName() {
    const h5Elements = document.querySelectorAll('h5');
    for (const h5 of h5Elements) {
      if (h5.textContent.includes('Настройка пакета')) {
        return h5.textContent.replace('Настройка пакета', '').replace('-', '').trim();
      }
    }
    return 'Тариф';
  }

  // Получаем полные данные периода через модальное окно
  async function getPeriodFullData(periodId) {
    return new Promise(async (resolve) => {
      const existingModal = document.querySelector('#editTimePeriodModal');
      if (existingModal) {
        const isOpen = existingModal.classList.contains('show') || 
                      window.getComputedStyle(existingModal).display !== 'none' ||
                      document.querySelector('.modal-backdrop');
        
        if (isOpen) {
          await closeModalCompletely(existingModal);
          await new Promise(r => setTimeout(r, 400));
        } else {
          cleanupModal(existingModal);
          await new Promise(r => setTimeout(r, 200));
        }
      }

      const cells = document.querySelectorAll(`.cell[onclick*="editTimePeriod(${periodId}"]`);
      let cell = null;

      for (const c of cells) {
        const onclick = c.getAttribute('onclick');
        if (onclick && onclick.includes(',')) {
          cell = c;
          break;
        }
      }

      if (!cell && cells.length > 0) {
        cell = cells[0];
      }

      if (!cell) {
        resolve(null);
        return;
      }

      let modalData = null;
      let resolved = false;

      const modal = document.querySelector('#editTimePeriodModal');
      if (!modal) {
        resolve(null);
        return;
      }

      const extractData = () => {
        const form = modal.querySelector('form');
        if (form) {
          const idValue = form.querySelector('input[name="id"]')?.value;
          if (idValue == periodId) {
            const groupSelect = form.querySelector('select[name="group_ids[]"]');
            
            // Получаем ВСЕ опции из select (не только выбранные!)
            // Количество опций = общее количество групп дней для этого периода
            let allGroupIds = [];
            let totalGroupsCount = 0;
            
            if (groupSelect) {
              // Берем ВСЕ опции из select
              allGroupIds = Array.from(groupSelect.options).map(opt => opt.value).filter(id => id);
              totalGroupsCount = allGroupIds.length;
            }
            
            return {
              id: idValue,
              club_id: form.querySelector('input[name="club_id"]')?.value,
              zone_id: form.querySelector('input[name="zone_id"]')?.value,
              time_from: form.querySelector('input[name="time_from"]')?.value,
              time_to: form.querySelector('input[name="time_to"]')?.value,
              visible_time_from: form.querySelector('input[name="visible_time_from"]')?.value,
              visible_time_to: form.querySelector('input[name="visible_time_to"]')?.value,
              price: form.querySelector('input[name="price"]')?.value,
              type_group_id: form.querySelector('input[name="type_group_id"]')?.value,
              all_group_ids: allGroupIds, // Все группы дней из select
              total_groups_count: totalGroupsCount // Общее количество групп дней
            };
          }
        }
        return null;
      };

      const onModalShown = () => {
        if (resolved) return;
        
        let attempts = 0;
        const maxAttempts = 50; // Увеличиваем количество попыток
        
        const checkData = setInterval(() => {
          attempts++;
          const data = extractData();
          
          // Проверяем, что данные полные, включая группы дней
          if (data && data.id && data.time_from && data.time_to) {
            // Дополнительная проверка групп дней - ждем, пока они загрузятся
            const groupSelect = modal.querySelector('select[name="group_ids[]"]');
            if (groupSelect) {
              // Если опции еще не загружены, ждем
              if (groupSelect.options.length === 0 && attempts < 30) {
                return;
              }
              
              // Если опции есть, но группы дней пустые, пробуем получить через jQuery
              if (data.group_ids === '' && attempts < 40) {
                if (typeof $ !== 'undefined') {
                  const $select = $(groupSelect);
                  const val = $select.val();
                  if (val && val.length > 0) {
                    data.group_ids = Array.isArray(val) ? val.join(',') : val;
                  } else {
                    // Продолжаем ждать
                    return;
                  }
                } else {
                  // Продолжаем ждать
                  return;
                }
              }
            }
            
            clearInterval(checkData);
            modalData = data;
            resolved = true;
            
            closeModalCompletely(modal).then(() => {
              setTimeout(() => {
                resolve(modalData);
              }, 200);
            });
          } else if (attempts >= maxAttempts) {
            clearInterval(checkData);
            if (!resolved) {
              resolved = true;
              resolve(null);
            }
          }
        }, 100);
      };

      const modalShownHandler = () => onModalShown();
      modal.addEventListener('shown.bs.modal', modalShownHandler);
      
      if (typeof $ !== 'undefined' && $.fn.modal) {
        $(modal).on('shown.bs.modal', modalShownHandler);
      }
      
      let checkCount = 0;
      const maxChecks = 50;
      const checkInterval = setInterval(() => {
        if (resolved) {
          clearInterval(checkInterval);
          return;
        }
        
        checkCount++;
        if (checkCount >= maxChecks) {
          clearInterval(checkInterval);
          if (!resolved) {
            resolved = true;
            resolve(null);
          }
          return;
        }
        
        const isOpen = modal.classList.contains('show') || 
                      window.getComputedStyle(modal).display !== 'none';
        
        if (isOpen) {
          const data = extractData();
          if (data) {
            onModalShown();
            clearInterval(checkInterval);
          }
        }
      }, 100);

      cell.click();

      setTimeout(() => {
        modal.removeEventListener('shown.bs.modal', modalShownHandler);
        if (typeof $ !== 'undefined' && $.fn.modal) {
          $(modal).off('shown.bs.modal', modalShownHandler);
        }
        clearInterval(checkInterval);
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      }, 6000);
    });
  }

  // Закрываем модальное окно
  function closeModalCompletely(modal) {
    return new Promise((resolve) => {
      if (typeof $ !== 'undefined' && $.fn.modal) {
        $(modal).modal('hide');
        $(modal).one('hidden.bs.modal', function() {
          cleanupModal(modal);
          resolve();
        });
        setTimeout(() => {
          cleanupModal(modal);
          resolve();
        }, 500);
      } else {
        const closeBtn = modal.querySelector('button[data-dismiss="modal"]');
        if (closeBtn) {
          closeBtn.click();
        }
        setTimeout(() => {
          cleanupModal(modal);
          resolve();
        }, 300);
      }
    });
  }

  // Очистка модального окна
  function cleanupModal(modal) {
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    
    modal.classList.remove('show', 'fade', 'in');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('aria-modal');
    
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  // Собираем данные тарифов для выбранных клубов и зон
  async function collectTariffDataForSelection(selectedClubsZones) {
    const data = [];
    // Кеш для данных периодов (чтобы не открывать модальное окно повторно)
    const periodDataCache = new Map();
    // Кеш для количества групп дней (чтобы не открывать модальное окно повторно)
    const periodGroupsCountCache = new Map();
    
    // Создаем Set для быстрой проверки
    const selectedSet = new Set();
    selectedClubsZones.forEach(item => {
      selectedSet.add(`${item.club_id}_${item.zone_id}`);
    });
    
    // Получаем маппинг типов дней
    const dayTypeMapping = getDayTypeMapping();
    
    // Получаем все таблицы (только первую - "Время старта")
    const timeRulers = document.querySelectorAll('.tableTimeRuler');
    
    for (const ruler of timeRulers) {
      const wrapper = ruler.closest('.time-ruler-wrapper');
      if (!wrapper) continue;
      
      const clubId = wrapper.getAttribute('data-club');
      const zoneId = wrapper.getAttribute('data-zone');
      
      // Проверяем, выбрана ли эта комбинация клуб/зона
      if (!selectedSet.has(`${clubId}_${zoneId}`)) {
        continue;
      }
      
      // Получаем название клуба и зоны
      const h5 = wrapper.querySelector('h5');
      const text = h5 ? h5.textContent : '';
      const parts = text.split('–');
      const clubName = parts[0]?.trim() || '';
      const zoneName = parts[1]?.trim() || '';
      
      // Обрабатываем каждую строку (rows) отдельно
      const rows = ruler.querySelectorAll('.rows');
      
      for (const row of rows) {
        // Получаем тип дня из этой строки
        const dayTypeCell = row.querySelector('.cell_end');
        const dayTypeName = dayTypeCell ? dayTypeCell.textContent.trim() : '';
        
        if (!dayTypeName) continue;
        
        // Получаем ID группы дней по названию типа дня
        const groupId = dayTypeMapping.get(dayTypeName);
        if (!groupId) {
          console.warn(`Не найден ID для типа дня: ${dayTypeName}`);
          continue;
        }
        
        // Получаем все ячейки с периодами в этой строке
        const cells = row.querySelectorAll('.cell[onclick*="editTimePeriod"]');
        
        for (const cell of cells) {
          const onclick = cell.getAttribute('onclick');
          if (!onclick || !onclick.includes(',')) continue;
          
          const match = onclick.match(/editTimePeriod\((\d+)/);
          if (!match) continue;
          
          const periodId = parseInt(match[1]);
          
          // Получаем данные периода (из кеша или через модальное окно)
          let fullData = periodDataCache.get(periodId);
          
          if (!fullData) {
            // Получаем данные через модальное окно
            fullData = await getPeriodFullData(periodId);
            if (fullData) {
              // Сохраняем в кеш
              periodDataCache.set(periodId, fullData);
            }
            // Небольшая задержка между запросами
            await new Promise(r => setTimeout(r, 300));
          }
          
          // Получаем количество групп дней для этого периода (из кеша или через модальное окно)
          let totalGroupsCount = periodGroupsCountCache.get(periodId);
          
          if (totalGroupsCount === undefined) {
            // Если нет в кеше, используем данные из fullData
            if (fullData && fullData.total_groups_count) {
              totalGroupsCount = fullData.total_groups_count;
            } else {
              // Если нет в fullData, открываем модальное окно только для подсчета
              const countData = await getPeriodFullData(periodId);
              if (countData && countData.total_groups_count) {
                totalGroupsCount = countData.total_groups_count;
              } else {
                totalGroupsCount = 1; // По умолчанию
              }
            }
            // Сохраняем в кеш
            periodGroupsCountCache.set(periodId, totalGroupsCount);
          }
          
          if (fullData) {
            // Добавляем запись с группой дней из строки таблицы
            data.push({
              id: fullData.id,
              club_id: fullData.club_id || clubId,
              zone_id: fullData.zone_id || zoneId,
              club_name: clubName,
              zone_name: zoneName,
              time_from: fullData.time_from,
              time_to: fullData.time_to,
              visible_time_from: fullData.visible_time_from,
              visible_time_to: fullData.visible_time_to,
              price: fullData.price,
              group_ids: groupId, // Используем ID группы из строки таблицы
              group_ids_count: totalGroupsCount // Общее количество групп дней из модального окна
            });
          }
        }
      }
    }
    
    return data;
  }

  // Экспорт в CSV
  function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    // Заголовки CSV (на русском)
    const headers = [
      'ID Клуба',
      'ID Зоны',
      'Название Клуба',
      'Название Зоны',
      'Старт От',
      'Старт До',
      'Отображение От',
      'Отображение До',
      'Цена',
      'ID Групп Дней',
      'Количество Групп Дней'
    ];

    // Формируем CSV
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
      // Используем сохраненное количество групп дней для этого периода
      const groupIdsCount = row.group_ids_count || 1;
      
      const values = [
        row.club_id || '',
        row.zone_id || '',
        `"${(row.club_name || '').replace(/"/g, '""')}"`,
        `"${(row.zone_name || '').replace(/"/g, '""')}"`,
        row.time_from || '',
        row.time_to || '',
        row.visible_time_from || '',
        row.visible_time_to || '',
        row.price || '',
        row.group_ids || '',
        groupIdsCount
      ];
      csv += values.join(',') + '\n';
    });

    // Создаем blob и скачиваем
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Парсинг CSV
  function parseCSV(csvText) {
    // Удаляем BOM если есть
    if (csvText.charCodeAt(0) === 0xFEFF) {
      csvText = csvText.slice(1);
    }
    
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return null;
    
    // Парсим заголовки
    const parseCSVLine = (line) => {
      const values = [];
      let currentValue = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            currentValue += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim().replace(/^"|"$/g, ''));
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim().replace(/^"|"$/g, ''));
      
      return values;
    };
    
    const headers = parseCSVLine(lines[0]);
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }
    
    return data;
  }

  // Валидация данных из CSV
  function validateCSVData(data) {
    const errors = [];
    const validData = [];
    
    // Функция для получения значения с поддержкой старых и новых названий
    const getValue = (row, ...keys) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
          return row[key];
        }
      }
      return null;
    };
    
    data.forEach((row, index) => {
      const errorsForRow = [];
      
      const clubId = getValue(row, 'ID Клуба', 'Club ID', 'club_id');
      const zoneId = getValue(row, 'ID Зоны', 'Zone ID', 'zone_id');
      
      if (!clubId || !zoneId) {
        errorsForRow.push('Отсутствует ID Клуба или ID Зоны');
      }
      
      const timeFrom = getValue(row, 'Старт От', 'Time From', 'time_from');
      const timeTo = getValue(row, 'Старт До', 'Time To', 'time_to');
      
      if (!timeFrom || !timeTo) {
        errorsForRow.push('Отсутствует время');
      }
      
      const price = getValue(row, 'Цена', 'Price', 'price');
      
      if (!price) {
        errorsForRow.push('Отсутствует цена');
      }
      
      if (errorsForRow.length > 0) {
        errors.push({
          row: index + 2,
          errors: errorsForRow
        });
      } else {
        validData.push({
          id: getValue(row, 'ID', 'id') || null,
          club_id: clubId,
          zone_id: zoneId,
          club_name: getValue(row, 'Название Клуба', 'Club Name', 'club_name') || '',
          zone_name: getValue(row, 'Название Зоны', 'Zone Name', 'zone_name') || '',
          time_from: timeFrom,
          time_to: timeTo,
          visible_time_from: getValue(row, 'Отображение От', 'Visible Time From', 'visible_time_from') || timeFrom,
          visible_time_to: getValue(row, 'Отображение До', 'Visible Time To', 'visible_time_to') || timeTo,
          price: price,
          group_ids: getValue(row, 'ID Групп Дней', 'Group IDs', 'group_ids') || '',
          group_ids_count: getValue(row, 'Количество Групп Дней', 'Group IDs Count', 'group_ids_count') || ''
        });
      }
    });
    
    return { validData, errors };
  }

  // Получаем список доступных клубов и зон
  function getAvailableClubsAndZones() {
    const clubs = new Map();
    
    document.querySelectorAll('.time-ruler-wrapper').forEach(wrapper => {
      const clubId = wrapper.getAttribute('data-club');
      const zoneId = wrapper.getAttribute('data-zone');
      const h5 = wrapper.querySelector('h5');
      
      if (clubId && zoneId && h5) {
        const text = h5.textContent;
        const parts = text.split('–');
        const clubName = parts[0]?.trim() || '';
        const zoneName = parts[1]?.trim() || '';
        
        if (!clubs.has(clubId)) {
          clubs.set(clubId, {
            id: clubId,
            name: clubName,
            zones: new Map()
          });
        }
        
        const club = clubs.get(clubId);
        club.zones.set(zoneId, {
          id: zoneId,
          name: zoneName
        });
      }
    });
    
    return clubs;
  }

  // Получаем доступные группы дней
  function getAvailableDayGroups() {
    const modal = document.querySelector('#editTimePeriodModal');
    if (!modal) return [];
    
    const select = modal.querySelector('select[name="group_ids[]"]');
    if (!select) return [];
    
    const groups = [];
    Array.from(select.options).forEach(option => {
      groups.push({
        id: option.value,
        name: option.textContent.trim()
      });
    });
    
    return groups;
  }

  // Получаем количество типов групп дней из таблицы или модального окна
  async function getAvailableDayGroupsCount() {
    // Сначала пытаемся посчитать из таблицы (более надежно)
    const firstRuler = document.querySelector('.tableTimeRuler');
    if (firstRuler) {
      const dayTypeCells = firstRuler.querySelectorAll('.rows .cell_end');
      if (dayTypeCells.length > 0) {
        console.log('Количество типов дней из таблицы:', dayTypeCells.length);
        return dayTypeCells.length;
      }
    }
    
    console.log('Не удалось получить из таблицы, открываем модальное окно');
    
    // Если не получилось из таблицы, открываем модальное окно на короткое время
    const cells = document.querySelectorAll('.cell[onclick*="editTimePeriod"]');
    if (cells.length === 0) {
      console.log('Не найдено ячеек с периодами');
      return 0;
    }
    
    // Берем первую ячейку с периодом
    let cell = null;
    for (const c of cells) {
      const onclick = c.getAttribute('onclick');
      if (onclick && onclick.includes(',')) {
        cell = c;
        break;
      }
    }
    
    if (!cell && cells.length > 0) {
      cell = cells[0];
    }
    
    if (!cell) {
      console.log('Не найдена подходящая ячейка');
      return 0;
    }
    
    const modal = document.querySelector('#editTimePeriodModal');
    if (!modal) {
      console.log('Модальное окно не найдено');
      return 0;
    }
    
    return new Promise((resolve) => {
      let resolved = false;
      
      const checkSelect = () => {
        const select = modal.querySelector('select[name="group_ids[]"]');
        if (select && select.options.length > 0) {
          if (!resolved) {
            resolved = true;
            const count = select.options.length;
            console.log('Количество типов дней из модального окна:', count);
            // Закрываем модальное окно
            closeModalCompletely(modal).then(() => {
              resolve(count);
            });
          }
        } else {
          console.log('Select не найден или пуст, options.length:', select ? select.options.length : 'select не найден');
        }
      };
      
      const modalShownHandler = () => {
        // Ждем немного, чтобы select загрузился
        setTimeout(() => {
          checkSelect();
        }, 200);
      };
      
      modal.addEventListener('shown.bs.modal', modalShownHandler);
      
      if (typeof $ !== 'undefined' && $.fn.modal) {
        $(modal).on('shown.bs.modal', modalShownHandler);
      }
      
      // Открываем модальное окно
      cell.click();
      
      // Таймаут на случай, если модальное окно не откроется
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          checkSelect();
          closeModalCompletely(modal).then(() => {
            resolve(0);
          });
        }
      }, 3000);
    });
  }

  // Получаем маппинг названий типов дней к их ID
  function getDayTypeMapping() {
    const mapping = new Map();
    
    // Пробуем получить из модального окна
    const modal = document.querySelector('#editTimePeriodModal');
    if (modal) {
      const select = modal.querySelector('select[name="group_ids[]"]');
      if (select) {
        Array.from(select.options).forEach(option => {
          const name = option.textContent.trim();
          const id = option.value;
          mapping.set(name, id);
          // Также добавляем варианты названий
          if (name.includes('Будний')) {
            mapping.set('Будний день', id);
            mapping.set('Будние дни', id);
          }
          if (name.includes('День перед выходными')) {
            mapping.set('День перед выходными', id);
          }
          if (name.includes('Выходные')) {
            mapping.set('Выходные', id);
            mapping.set('Выходные дни', id);
          }
          if (name.includes('День перед будними')) {
            mapping.set('День перед будними', id);
          }
        });
      }
    }
    
    return mapping;
  }

  // Получаем ID группы дней по названию типа дня из таблицы
  function getGroupIdByDayTypeName(dayTypeName) {
    const mapping = getDayTypeMapping();
    return mapping.get(dayTypeName) || null;
  }

  // Модальное окно выбора клубов и зон для экспорта
  function showExportSelectionModal() {
    return new Promise((resolve) => {
      const clubs = getAvailableClubsAndZones();
      
      if (clubs.size === 0) {
        alert('Не найдено клубов и зон для экспорта');
        resolve(null);
        return;
      }

      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = 'tariffExportSelectionModal';
      modal.setAttribute('tabindex', '-1');
      modal.setAttribute('role', 'dialog');

      let modalHTML = `
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Выберите клубы и зоны для экспорта</h5>
              <button type="button" class="close tariff-export-close" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body" style="max-height: 500px; overflow-y: auto;">
              <div style="margin-bottom: 15px;">
                <button type="button" class="btn btn-sm btn-secondary" id="select-all-clubs">Выбрать все</button>
                <button type="button" class="btn btn-sm btn-secondary" id="deselect-all-clubs">Снять все</button>
              </div>
      `;

      clubs.forEach((club, clubId) => {
        modalHTML += `
          <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
            <label style="font-weight: bold; margin-bottom: 10px; display: block;">
              <input type="checkbox" class="club-checkbox" data-club="${clubId}" style="margin-right: 5px;">
              ${escapeHtml(club.name || `Клуб ${clubId}`)}
            </label>
            <div style="margin-left: 25px;">
        `;
        
        club.zones.forEach((zone, zoneId) => {
          modalHTML += `
            <label style="display: block; margin-bottom: 5px;">
              <input type="checkbox" class="zone-checkbox" data-club="${clubId}" data-zone="${zoneId}" style="margin-right: 5px;">
              ${escapeHtml(zone.name || `Зона ${zoneId}`)}
            </label>
          `;
        });
        
        modalHTML += `
            </div>
          </div>
        `;
      });

      modalHTML += `
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary tariff-export-cancel">Отмена</button>
              <button type="button" class="btn btn-primary" id="export-confirm-btn">Экспортировать</button>
            </div>
          </div>
        </div>
      `;

      modal.innerHTML = modalHTML;
      document.body.appendChild(modal);

      // Обработчики
      const selectAllBtn = modal.querySelector('#select-all-clubs');
      const deselectAllBtn = modal.querySelector('#deselect-all-clubs');
      const confirmBtn = modal.querySelector('#export-confirm-btn');
      const clubCheckboxes = modal.querySelectorAll('.club-checkbox');
      const zoneCheckboxes = modal.querySelectorAll('.zone-checkbox');

      // Выбрать все клубы
      selectAllBtn.addEventListener('click', () => {
        clubCheckboxes.forEach(cb => cb.checked = true);
        zoneCheckboxes.forEach(cb => cb.checked = true);
      });

      // Снять все
      deselectAllBtn.addEventListener('click', () => {
        clubCheckboxes.forEach(cb => cb.checked = false);
        zoneCheckboxes.forEach(cb => cb.checked = false);
      });

      // При выборе клуба выбираем все его зоны
      clubCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
          const clubId = cb.getAttribute('data-club');
          zoneCheckboxes.forEach(zcb => {
            if (zcb.getAttribute('data-club') === clubId) {
              zcb.checked = cb.checked;
            }
          });
        });
      });

      // Функция закрытия модального окна
      const closeExportModal = () => {
        if (typeof $ !== 'undefined' && $.fn.modal) {
          $(modal).modal('hide');
          $(modal).one('hidden.bs.modal', () => {
            cleanupModal(modal);
          });
        } else {
          cleanupModal(modal);
        }
      };

      // Обработчик для крестика
      const closeBtn = modal.querySelector('.tariff-export-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeExportModal();
          resolve(null);
        });
      }

      // Обработчик для кнопки "Отмена"
      const cancelBtn = modal.querySelector('.tariff-export-cancel');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeExportModal();
          resolve(null);
        });
      }

      // Закрытие по клику на backdrop
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeExportModal();
          resolve(null);
        }
      });

      // Закрытие по ESC
      const handleEsc = (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
          closeExportModal();
          document.removeEventListener('keydown', handleEsc);
          resolve(null);
        }
      };
      document.addEventListener('keydown', handleEsc);

      // Подтверждение
      confirmBtn.addEventListener('click', () => {
        const selected = [];
        zoneCheckboxes.forEach(cb => {
          if (cb.checked) {
            const clubId = cb.getAttribute('data-club');
            const zoneId = cb.getAttribute('data-zone');
            const club = clubs.get(clubId);
            const zone = club.zones.get(zoneId);
            selected.push({
              club_id: clubId,
              zone_id: zoneId,
              club_name: club.name,
              zone_name: zone.name
            });
          }
        });

        if (selected.length === 0) {
          alert('Выберите хотя бы одну зону');
          return;
        }

        // Закрываем модальное окно
        closeExportModal();
        document.removeEventListener('keydown', handleEsc);
        resolve(selected);
      });

      // Показываем модальное окно
      if (typeof $ !== 'undefined' && $.fn.modal) {
        $(modal).modal({
          backdrop: true,
          keyboard: true,
          show: true
        });
      } else {
        // Создаем backdrop вручную
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade';
        backdrop.id = 'tariff-export-backdrop';
        backdrop.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1040;
          width: 100vw;
          height: 100vh;
          background-color: #000;
        `;
        document.body.appendChild(backdrop);
        
        // Анимация появления backdrop
        requestAnimationFrame(() => {
          backdrop.classList.add('show');
          backdrop.style.opacity = '0.5';
        });
        
        // Показываем модальное окно
        modal.style.cssText = `
          display: block !important;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1050;
          width: 100%;
          height: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          outline: 0;
        `;
        
        requestAnimationFrame(() => {
          modal.classList.add('show');
        });
        
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        
        // Вычисляем ширину скроллбара и компенсируем
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) {
          document.body.style.paddingRight = scrollbarWidth + 'px';
        }
      }
    });
  }

  // Модальное окно выбора клубов и зон для импорта (маппинг)
  function showImportMappingModal(csvData) {
    return new Promise((resolve) => {
      const availableClubs = getAvailableClubsAndZones();
      
      // Получаем уникальные клубы и зоны из CSV
      const csvClubs = new Map();
      csvData.forEach(row => {
        const clubId = row['ID Клуба'] || row['Club ID'] || row.club_id;
        const zoneId = row['ID Зоны'] || row['Zone ID'] || row.zone_id;
        const clubName = row['Название Клуба'] || row['Club Name'] || row.club_name || '';
        const zoneName = row['Название Зоны'] || row['Zone Name'] || row.zone_name || '';
        
        if (clubId && zoneId) {
          const key = `${clubId}_${zoneId}`;
          if (!csvClubs.has(key)) {
            csvClubs.set(key, {
              club_id: clubId,
              zone_id: zoneId,
              club_name: clubName,
              zone_name: zoneName
            });
          }
        }
      });

      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = 'tariffImportMappingModal';
      modal.setAttribute('tabindex', '-1');
      modal.setAttribute('role', 'dialog');

      let modalHTML = `
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Выберите клубы и зоны для импорта</h5>
              <button type="button" class="close tariff-mapping-close" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body" style="max-height: 500px; overflow-y: auto;">
              <div class="alert alert-info">
                Выберите, в какие клубы и зоны загружать данные из CSV. Если клуб/зона из CSV не найден, запись будет пропущена.
              </div>
              <table class="table table-bordered table-sm">
                <thead>
                  <tr>
                    <th style="width: 50px;"></th>
                    <th>Клуб из CSV</th>
                    <th>Зона из CSV</th>
                    <th>Выберите клуб</th>
                    <th>Выберите зону</th>
                  </tr>
                </thead>
                <tbody>
      `;

      csvClubs.forEach((csvItem, key) => {
        modalHTML += `
          <tr data-key="${key}" class="tariff-mapping-row">
             <td style="text-align: center;">
               <span class="tariff-mapping-trash" data-key="${key}" title="Удалить/Восстановить строку">
                 <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M5.5 5.5C5.77614 5.5 6 5.72386 6 6V12C6 12.2761 5.77614 12.5 5.5 12.5C5.22386 12.5 5 12.2761 5 12V6C5 5.72386 5.22386 5.5 5.5 5.5Z" fill="currentColor"/>
                   <path d="M8 5.5C8.27614 5.5 8.5 5.72386 8.5 6V12C8.5 12.2761 8.27614 12.5 8 12.5C7.72386 12.5 7.5 12.2761 7.5 12V6C7.5 5.72386 7.72386 5.5 8 5.5Z" fill="currentColor"/>
                   <path d="M11 6C11 5.72386 10.7761 5.5 10.5 5.5C10.2239 5.5 10 5.72386 10 6V12C10 12.2761 10.2239 12.5 10.5 12.5C10.7761 12.5 11 12.2761 11 12V6Z" fill="currentColor"/>
                   <path fill-rule="evenodd" clip-rule="evenodd" d="M14.5 3H11V2C11 1.44772 10.5523 1 10 1H6C5.44772 1 5 1.44772 5 2V3H1.5C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H2V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V4H14.5C14.7761 4 15 3.77614 15 3.5C15 3.22386 14.7761 3 14.5 3ZM6 2H10V3H6V2ZM13 4H3V13H13V4Z" fill="currentColor"/>
                 </svg>
               </span>
             </td>
            <td>${escapeHtml(csvItem.club_name || csvItem.club_id)}</td>
            <td>${escapeHtml(csvItem.zone_name || csvItem.zone_id)}</td>
            <td>
              <select class="form-control form-control-sm import-club-select" data-key="${key}">
                <option value="">-- Не импортировать --</option>
        `;
        
        availableClubs.forEach((club, clubId) => {
          modalHTML += `<option value="${clubId}">${escapeHtml(club.name || `Клуб ${clubId}`)}</option>`;
        });
        
        modalHTML += `
              </select>
            </td>
            <td>
              <select class="form-control form-control-sm import-zone-select" data-key="${key}">
                <option value="">-- Сначала выберите клуб --</option>
              </select>
            </td>
          </tr>
        `;
      });

      modalHTML += `
                </tbody>
              </table>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary tariff-mapping-cancel">Отмена</button>
              <button type="button" class="btn btn-primary" id="import-mapping-confirm-btn">Продолжить</button>
            </div>
          </div>
        </div>
      `;
      
      // Добавляем стили для корзины
      const style = document.createElement('style');
      style.textContent = `
        .tariff-mapping-row-deleted {
          opacity: 0.4;
          background-color: #f5f5f5 !important;
        }
         .tariff-mapping-trash {
           cursor: pointer;
           display: inline-block;
           padding: 5px;
           color: #666;
           transition: color 0.2s;
           vertical-align: middle;
         }
         .tariff-mapping-trash svg {
           display: block;
         }
        .tariff-mapping-trash:hover {
          color: #dc3545;
        }
        .tariff-mapping-trash.deleted {
          color: #dc3545;
        }
      `;
      document.head.appendChild(style);

      modal.innerHTML = modalHTML;
      document.body.appendChild(modal);

      // Множество удаленных строк
      const deletedRows = new Set();

      // Обработчики для корзины
      const trashButtons = modal.querySelectorAll('.tariff-mapping-trash');
      trashButtons.forEach(trash => {
        trash.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const key = trash.getAttribute('data-key');
          const row = modal.querySelector(`tr[data-key="${key}"]`);
          
          if (deletedRows.has(key)) {
            // Восстанавливаем строку
            deletedRows.delete(key);
            row.classList.remove('tariff-mapping-row-deleted');
            trash.classList.remove('deleted');
            // Включаем select'ы
            row.querySelectorAll('select').forEach(sel => {
              sel.disabled = false;
            });
          } else {
            // Удаляем строку
            deletedRows.add(key);
            row.classList.add('tariff-mapping-row-deleted');
            trash.classList.add('deleted');
            // Отключаем select'ы
            row.querySelectorAll('select').forEach(sel => {
              sel.disabled = true;
              sel.value = '';
            });
          }
        });
      });

      // Обработчики для выбора зон
      const clubSelects = modal.querySelectorAll('.import-club-select');
      clubSelects.forEach(select => {
        select.addEventListener('change', () => {
          const clubId = select.value;
          const key = select.getAttribute('data-key');
          const zoneSelect = modal.querySelector(`.import-zone-select[data-key="${key}"]`);
          
          zoneSelect.innerHTML = '<option value="">-- Выберите зону --</option>';
          
          if (clubId) {
            const club = availableClubs.get(clubId);
            if (club) {
              club.zones.forEach((zone, zoneId) => {
                const option = document.createElement('option');
                option.value = zoneId;
                option.textContent = zone.name || `Зона ${zoneId}`;
                zoneSelect.appendChild(option);
              });
            }
          }
        });
      });

      // Функция закрытия модального окна
      const closeMappingModal = () => {
        if (typeof $ !== 'undefined' && $.fn.modal) {
          $(modal).modal('hide');
          $(modal).one('hidden.bs.modal', () => {
            cleanupModal(modal);
          });
        } else {
          cleanupModal(modal);
        }
      };

      // Обработчик для крестика
      const closeBtn = modal.querySelector('.tariff-mapping-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeMappingModal();
          resolve(null);
        });
      }

      // Обработчик для кнопки "Отмена"
      const cancelBtn = modal.querySelector('.tariff-mapping-cancel');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeMappingModal();
          resolve(null);
        });
      }

      // Закрытие по клику на backdrop
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeMappingModal();
          resolve(null);
        }
      });

      // Закрытие по ESC
      const handleEsc = (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
          closeMappingModal();
          document.removeEventListener('keydown', handleEsc);
          resolve(null);
        }
      };
      document.addEventListener('keydown', handleEsc);

      const confirmBtn = modal.querySelector('#import-mapping-confirm-btn');
      confirmBtn.addEventListener('click', () => {
        const mapping = new Map();
        
        clubSelects.forEach(select => {
          const key = select.getAttribute('data-key');
          
          // Пропускаем удаленные строки
          if (deletedRows.has(key)) {
            return;
          }
          
          const clubId = select.value;
          const zoneSelect = modal.querySelector(`.import-zone-select[data-key="${key}"]`);
          const zoneId = zoneSelect.value;
          
          if (clubId && zoneId) {
            const csvItem = csvClubs.get(key);
            mapping.set(key, {
              csv_club_id: csvItem.club_id,
              csv_zone_id: csvItem.zone_id,
              target_club_id: clubId,
              target_zone_id: zoneId
            });
          }
        });

        if (mapping.size === 0) {
          alert('Выберите хотя бы одну пару клуб/зона');
          return;
        }

        // Закрываем модальное окно
        closeMappingModal();
        document.removeEventListener('keydown', handleEsc);
        resolve(mapping);
      });

      // Показываем модальное окно
      if (typeof $ !== 'undefined' && $.fn.modal) {
        $(modal).modal({
          backdrop: true,
          keyboard: true,
          show: true
        });
      } else {
        // Создаем backdrop вручную
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade';
        backdrop.id = 'tariff-mapping-backdrop';
        backdrop.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1040;
          width: 100vw;
          height: 100vh;
          background-color: #000;
        `;
        document.body.appendChild(backdrop);
        
        // Анимация появления backdrop
        requestAnimationFrame(() => {
          backdrop.classList.add('show');
          backdrop.style.opacity = '0.5';
        });
        
        // Показываем модальное окно
        modal.style.cssText = `
          display: block !important;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1050;
          width: 100%;
          height: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          outline: 0;
        `;
        
        requestAnimationFrame(() => {
          modal.classList.add('show');
        });
        
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        
        // Вычисляем ширину скроллбара и компенсируем
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) {
          document.body.style.paddingRight = scrollbarWidth + 'px';
        }
      }
    });
  }

  // Применяем данные из CSV
  async function applyCSVData(data, onProgress) {
    const typeGroupId = getTypeGroupId();
    if (!typeGroupId) {
      return { success: false, message: 'Не удалось определить ID группы тарифа' };
    }

    const availableClubs = getAvailableClubsAndZones();
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    const total = data.length;
    let processed = 0;

    for (const row of data) {
      // Проверяем, существует ли клуб и зона
      const club = availableClubs.get(row.club_id);
      if (!club) {
        skippedCount++;
        processed++;
        if (onProgress) {
          onProgress(processed, total, `Клуб ${row.club_id} не найден`, { skipped: true });
        }
        continue;
      }

      const zone = club.zones.get(row.zone_id);
      if (!zone) {
        skippedCount++;
        processed++;
        if (onProgress) {
          onProgress(processed, total, `Зона ${row.zone_id} в клубе ${row.club_id} не найдена`, { skipped: true });
        }
        continue;
      }

      // Формируем данные для обновления
      // ВАЖНО: порядок параметров имеет значение! group_ids должен идти перед временными параметрами
      const formData = new URLSearchParams();
      formData.append('action', 'edit_time_period');
      formData.append('type_group_id', typeGroupId);
      
      // При импорте CSV всегда создаем новые периоды (id пустой)
      // Если нужно редактировать существующий, это делается через массовое изменение цен
      formData.append('id', ''); // Всегда пустой id для создания нового периода
      
      formData.append('club_id', row.club_id);
      formData.append('zone_id', row.zone_id);
      
      // group_ids должен идти ПЕРЕД временными параметрами!
      if (row.group_ids && row.group_ids.trim()) {
        const groupIds = row.group_ids.split(',').map(id => id.trim()).filter(id => id);
        groupIds.forEach(id => {
          formData.append('group_ids[]', id);
        });
      }
      
      formData.append('time_from', row.time_from || '00:00');
      formData.append('time_to', row.time_to || '23:59');
      formData.append('visible_time_from', row.visible_time_from || row.time_from || '00:00');
      formData.append('visible_time_to', row.visible_time_to || row.time_to || '23:59');
      formData.append('price', row.price);
      formData.append('reactive', '1');

      try {
        const response = await fetch('/tariff/crud.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'include',
          body: formData.toString()
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();
        
        // Проверяем, что ответ не пустой
        if (!responseText || responseText.trim() === '') {
          throw new Error('Пустой ответ от сервера');
        }
        
        let result;
        
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Ошибка парсинга JSON:', responseText);
          throw new Error(`Не удалось распарсить ответ сервера: ${responseText.substring(0, 100)}`);
        }
        
        // Проверяем, что в ответе есть поле code
        if (result.code === undefined || result.code === null) {
          console.error('Ответ не содержит поле code:', result);
          throw new Error('Ответ сервера не содержит поле code');
        }
        
        results.push({
          row: row,
          result: result
        });

        // code 8 = "Цена добавлена" (создание)
        // code 13 = "Цена обновлена" (обновление)
        // Только эти коды считаются успехом!
        const code = parseInt(result.code);
        if (code === 8 || code === 13) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Ошибка обновления периода. Код ответа: ${result.code}, Текст: ${result.code_text || 'нет'}`, result);
        }

        processed++;
        if (onProgress) {
          onProgress(processed, total, `${row.club_name} - ${row.zone_name}`, result);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        errorCount++;
        processed++;
        const errorResult = { 
          error: error.message,
          code: -1,
          code_text: error.message
        };
        
        results.push({
          row: row,
          result: errorResult
        });
        
        console.error(`Ошибка при обновлении периода ${row.club_id}/${row.zone_id}:`, error);
        if (onProgress) {
          onProgress(processed, total, `${row.club_name} - ${row.zone_name}`, errorResult);
        }
      }
    }

    return {
      success: true,
      total: total,
      successCount: successCount,
      errorCount: errorCount,
      skippedCount: skippedCount,
      results: results
    };
  }

  // Создаем UI для экспорта/импорта
  function createCSVImportExportUI() {
    // Проверяем, не добавлен ли уже блок
    if (document.querySelector('.tariff-csv-container')) {
      return;
    }

    // Ищем блок массового изменения цен или заголовок "Настройка пакета"
    const bulkContainer = document.querySelector('.bulk-price-update-container');
    const h5Elements = document.querySelectorAll('h5');
    let targetH5 = null;

    for (const h5 of h5Elements) {
      if (h5.textContent.includes('Настройка пакета')) {
        targetH5 = h5;
        break;
      }
    }

    if (!targetH5 && !bulkContainer) {
      return;
    }

    const container = document.createElement('div');
    container.className = 'tariff-csv-container';
    container.style.cssText = `
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
      background-color: #f0f8ff;
    `;

    container.innerHTML = `
      <h6 style="margin-top: 0;">Экспорт / Импорт тарифов</h6>
      <div style="display: flex; gap: 10px; margin-bottom: 10px;">
        <button class="btn btn-success tariff-export-btn" style="flex: 1;">
          <i class="fa fa-download"></i> Выгрузить CSV
        </button>
        <button class="btn btn-info tariff-import-btn" style="flex: 1;">
          <i class="fa fa-upload"></i> Загрузить CSV
        </button>
      </div>
      <input type="file" accept=".csv" id="tariff-csv-file-input" style="display: none;">
      <div class="tariff-csv-status" style="margin-top: 10px; display: none;"></div>
    `;

    // Вставляем после блока массового изменения или после заголовка
    if (bulkContainer) {
      bulkContainer.parentNode.insertBefore(container, bulkContainer.nextSibling);
    } else if (targetH5) {
      targetH5.parentNode.insertBefore(container, targetH5.nextSibling);
    }

    const exportBtn = container.querySelector('.tariff-export-btn');
    const importBtn = container.querySelector('.tariff-import-btn');
    const fileInput = container.querySelector('#tariff-csv-file-input');
    const statusDiv = container.querySelector('.tariff-csv-status');

    // Экспорт
    exportBtn.addEventListener('click', async () => {
      // Показываем модальное окно выбора клубов и зон
      const selected = await showExportSelectionModal();
      
      if (!selected || selected.length === 0) {
        return;
      }

      exportBtn.disabled = true;
      exportBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Сбор данных...';
      statusDiv.style.display = 'block';
      statusDiv.className = 'tariff-csv-status alert alert-info';
      statusDiv.textContent = `Собираем данные для ${selected.length} зон... Это может занять некоторое время.`;

      try {
        const data = await collectTariffDataForSelection(selected);
        const packageName = getPackageName();
        const typeGroupId = getTypeGroupId();
        const filename = `tariff_${packageName}_${typeGroupId}_${new Date().toISOString().split('T')[0]}.csv`;
        
        exportToCSV(data, filename);
        
        statusDiv.className = 'tariff-csv-status alert alert-success';
        statusDiv.textContent = `Успешно экспортировано ${data.length} записей`;
        
        setTimeout(() => {
          statusDiv.style.display = 'none';
        }, 3000);
      } catch (error) {
        statusDiv.className = 'tariff-csv-status alert alert-danger';
        statusDiv.textContent = 'Ошибка при экспорте: ' + error.message;
      } finally {
        exportBtn.disabled = false;
        exportBtn.innerHTML = '<i class="fa fa-download"></i> Выгрузить CSV';
      }
    });

    // Импорт
    importBtn.addEventListener('click', () => {
      fileInput.click();
    });

      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const csvText = event.target.result;
            const parsedData = parseCSV(csvText);
            
            if (!parsedData || parsedData.length === 0) {
              alert('CSV файл пуст или имеет неверный формат');
              fileInput.value = '';
              return;
            }

            const validation = validateCSVData(parsedData);
            
            if (validation.errors.length > 0) {
              let errorMsg = 'Обнаружены ошибки в CSV:\n\n';
              validation.errors.slice(0, 10).forEach(err => {
                errorMsg += `Строка ${err.row}: ${err.errors.join(', ')}\n`;
              });
              if (validation.errors.length > 10) {
                errorMsg += `... и еще ${validation.errors.length - 10} ошибок`;
              }
              alert(errorMsg);
              fileInput.value = '';
              return;
            }

            // Проверяем количество типов дней в системе
            const availableGroupsCount = await getAvailableDayGroupsCount();
            console.log('Доступно типов дней в системе:', availableGroupsCount);
            
            // Проверяем максимальное значение "Количество Групп Дней" в CSV
            // Это и есть реальное количество типов дней для периодов
            let csvMaxGroupsCount = 0;
            console.log('Проверяем данные из CSV, всего строк:', validation.validData.length);
            validation.validData.forEach((row, index) => {
              // Пробуем разные варианты названий колонки
              const groupsCountStr = row['Количество Групп Дней'] || 
                                    row['Group IDs Count'] || 
                                    row.group_ids_count ||
                                    row['Количество групп дней'] ||
                                    '';
              
              console.log(`Строка ${index}:`, {
                'Количество Групп Дней': row['Количество Групп Дней'],
                'Group IDs Count': row['Group IDs Count'],
                'group_ids_count': row.group_ids_count,
                'Все ключи': Object.keys(row)
              });
              
              const groupsCount = parseInt(groupsCountStr, 10);
              if (!isNaN(groupsCount) && groupsCount > csvMaxGroupsCount) {
                csvMaxGroupsCount = groupsCount;
              }
            });
            console.log('Максимальное количество типов дней в CSV:', csvMaxGroupsCount);
            
            // Предупреждение, если в CSV указано больше типов дней, чем доступно в системе
            if (csvMaxGroupsCount > 0 && availableGroupsCount > 0 && csvMaxGroupsCount > availableGroupsCount) {
              console.log('Показываем предупреждение: CSV имеет больше типов дней, чем доступно в системе');
              const confirmed = confirm(
                `Внимание!\n\n` +
                `В CSV файле указано ${csvMaxGroupsCount} тип(ов) дней для периодов.\n` +
                `В системе доступно только ${availableGroupsCount} тип(ов) дней.\n\n` +
                `Некоторые типы дней из CSV могут отсутствовать в системе.\n` +
                `Вам может потребоваться корректировка данных после импорта.\n\n` +
                `Продолжить импорт?`
              );
              
              if (!confirmed) {
                fileInput.value = '';
                return;
              }
            } else {
              console.log('Предупреждение не показано:', {
                csvMaxGroupsCount,
                availableGroupsCount,
                condition: csvMaxGroupsCount > 0 && availableGroupsCount > 0 && csvMaxGroupsCount > availableGroupsCount
              });
            }

            // Показываем модальное окно маппинга
            const mapping = await showImportMappingModal(parsedData);
            
            if (!mapping || mapping.size === 0) {
              fileInput.value = '';
              return;
            }

            // Применяем маппинг к данным
            const availableClubs = getAvailableClubsAndZones();
            const mappedData = validation.validData.map(row => {
              const csvClubId = row.club_id || row['ID Клуба'] || row['Club ID'];
              const csvZoneId = row.zone_id || row['ID Зоны'] || row['Zone ID'];
              const key = `${csvClubId}_${csvZoneId}`;
              
              const map = mapping.get(key);
              if (map) {
                // Получаем названия целевых клуба и зоны
                const targetClub = availableClubs.get(map.target_club_id);
                const targetZone = targetClub ? targetClub.zones.get(map.target_zone_id) : null;
                
                return {
                  ...row,
                  id: null, // При импорте всегда создаем новые периоды, очищаем ID
                  club_id: map.target_club_id,
                  zone_id: map.target_zone_id,
                  club_name: targetClub ? targetClub.name : `Клуб ${map.target_club_id}`,
                  zone_name: targetZone ? targetZone.name : `Зона ${map.target_zone_id}`
                };
              }
              return null;
            }).filter(row => row !== null);

            // Показываем модальное окно с предпросмотром
            showImportPreviewModal(mappedData);
            fileInput.value = '';
          } catch (error) {
            alert('Ошибка при чтении CSV: ' + error.message);
            fileInput.value = '';
          }
        };

        reader.readAsText(file, 'UTF-8');
      });
  }

  // Модальное окно предпросмотра импорта
  function showImportPreviewModal(data) {
    // Удаляем старое модальное окно, если есть
    const oldModal = document.querySelector('#tariffImportPreviewModal');
    if (oldModal) {
      oldModal.remove();
    }

    const availableGroups = getAvailableDayGroups();

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'tariffImportPreviewModal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('role', 'dialog');

    modal.innerHTML = `
      <div class="modal-dialog" role="document" style="width: 85%; max-width: 95%;">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Загруженный тариф - Предпросмотр</h5>
            <button type="button" class="close tariff-modal-close" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              Найдено записей: ${data.length}. Вы можете редактировать данные перед применением.
            </div>
            <div style="max-height: 600px; overflow-y: auto;">
              <table class="table table-bordered table-sm" id="tariff-preview-table">
                <thead>
                  <tr>
                    <th style="width: 50px;"></th>
                    <th>Клуб</th>
                    <th>Зона</th>
                    <th>старт</th>
                    <th>завершение</th>
                    <th>отображение (от)</th>
                    <th>отображение (до)</th>
                    <th>Цена</th>
                    <th>Группы дней</th>
                  </tr>
                </thead>
                <tbody>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary tariff-modal-cancel">Отмена</button>
            <button type="button" class="btn btn-primary" id="tariff-apply-btn">Применить изменения</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Добавляем стили для корзины и удаленных строк
    const style = document.createElement('style');
    style.textContent = `
      .tariff-preview-row-deleted {
        opacity: 0.4;
        background-color: #f5f5f5 !important;
      }
      .tariff-preview-trash {
        cursor: pointer;
        display: inline-block;
        padding: 5px;
        color: #666;
        transition: color 0.2s;
        vertical-align: middle;
      }
      .tariff-preview-trash:hover {
        color: #dc3545;
      }
      .tariff-preview-trash.deleted {
        color: #dc3545;
      }
      .tariff-preview-trash svg {
        display: block;
      }
    `;
    document.head.appendChild(style);

    const tbody = modal.querySelector('#tariff-preview-table tbody');
    const importData = data.map(row => ({ ...row })); // Копируем данные для редактирования
    const deletedRows = new Set(); // Множество удаленных строк

    // Заполняем таблицу
    importData.forEach((row, index) => {
      const tr = document.createElement('tr');
      
      // Создаем select для групп дней
      const groupSelect = document.createElement('select');
      groupSelect.className = 'form-control form-control-sm';
      groupSelect.setAttribute('multiple', '');
      groupSelect.setAttribute('size', '2');
      groupSelect.setAttribute('data-field', 'group_ids');
      groupSelect.setAttribute('data-index', index);
      groupSelect.style.width = '150px';
      
      const currentGroupIds = (row.group_ids || '').split(',').map(id => id.trim()).filter(id => id);
      
      availableGroups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        if (currentGroupIds.includes(group.id)) {
          option.selected = true;
        }
        groupSelect.appendChild(option);
      });
      
      // SVG иконка корзинки
      const trashIcon = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.5 5.5C5.77614 5.5 6 5.72386 6 6V12C6 12.2761 5.77614 12.5 5.5 12.5C5.22386 12.5 5 12.2761 5 12V6C5 5.72386 5.22386 5.5 5.5 5.5Z" fill="currentColor"/>
          <path d="M8 5.5C8.27614 5.5 8.5 5.72386 8.5 6V12C8.5 12.2761 8.27614 12.5 8 12.5C7.72386 12.5 7.5 12.2761 7.5 12V6C7.5 5.72386 7.72386 5.5 8 5.5Z" fill="currentColor"/>
          <path d="M11 6C11 5.72386 10.7761 5.5 10.5 5.5C10.2239 5.5 10 5.72386 10 6V12C10 12.2761 10.2239 12.5 10.5 12.5C10.7761 12.5 11 12.2761 11 12V6Z" fill="currentColor"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M14.5 3H11V2C11 1.44772 10.5523 1 10 1H6C5.44772 1 5 1.44772 5 2V3H1.5C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H2V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V4H14.5C14.7761 4 15 3.77614 15 3.5C15 3.22386 14.7761 3 14.5 3ZM6 2H10V3H6V2ZM13 4H3V13H13V4Z" fill="currentColor"/>
        </svg>
      `;
      
      tr.setAttribute('data-index', index);
      tr.className = 'tariff-preview-row';
      tr.innerHTML = `
        <td style="text-align: center;">
          <span class="tariff-preview-trash" data-index="${index}" title="Удалить/Восстановить строку">${trashIcon}</span>
        </td>
        <td>${escapeHtml(row.club_name || row.club_id)}</td>
        <td>${escapeHtml(row.zone_name || row.zone_id)}</td>
        <td><input type="time" class="form-control form-control-sm" value="${row.time_from || ''}" data-field="time_from" data-index="${index}"></td>
        <td><input type="time" class="form-control form-control-sm" value="${row.time_to || ''}" data-field="time_to" data-index="${index}"></td>
        <td><input type="time" class="form-control form-control-sm" value="${row.visible_time_from || row.time_from || ''}" data-field="visible_time_from" data-index="${index}"></td>
        <td><input type="time" class="form-control form-control-sm" value="${row.visible_time_to || row.time_to || ''}" data-field="visible_time_to" data-index="${index}"></td>
        <td><input type="number" class="form-control form-control-sm" step="0.01" value="${row.price || ''}" data-field="price" data-index="${index}"></td>
        <td></td>
      `;
      
      // Вставляем select в последнюю ячейку
      const lastCell = tr.querySelector('td:last-child');
      lastCell.appendChild(groupSelect);
      
      tbody.appendChild(tr);
    });

    // Обработчики редактирования
    modal.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', () => {
        const index = parseInt(input.getAttribute('data-index'));
        const field = input.getAttribute('data-field');
        importData[index][field] = input.value;
      });
    });

    // Обработчики для select групп дней
    modal.querySelectorAll('select[data-field="group_ids"]').forEach(select => {
      select.addEventListener('change', () => {
        const index = parseInt(select.getAttribute('data-index'));
        if (!deletedRows.has(index)) {
          const selectedIds = Array.from(select.selectedOptions).map(opt => opt.value);
          importData[index].group_ids = selectedIds.join(',');
        }
      });
    });

    // Обработчики для корзины
    const updateRowCount = () => {
      const activeCount = importData.length - deletedRows.size;
      const alertDiv = modal.querySelector('.alert-info');
      if (alertDiv) {
        alertDiv.textContent = `Найдено записей: ${data.length}. Активных: ${activeCount}. Вы можете редактировать данные перед применением.`;
      }
    };

    modal.querySelectorAll('.tariff-preview-trash').forEach(trash => {
      trash.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(trash.getAttribute('data-index'));
        const row = modal.querySelector(`tr[data-index="${index}"]`);
        
        if (deletedRows.has(index)) {
          // Восстанавливаем строку
          deletedRows.delete(index);
          row.classList.remove('tariff-preview-row-deleted');
          trash.classList.remove('deleted');
          // Включаем все input и select
          row.querySelectorAll('input, select').forEach(el => {
            el.disabled = false;
          });
        } else {
          // Удаляем строку
          deletedRows.add(index);
          row.classList.add('tariff-preview-row-deleted');
          trash.classList.add('deleted');
          // Отключаем все input и select
          row.querySelectorAll('input, select').forEach(el => {
            el.disabled = true;
          });
        }
        updateRowCount();
      });
    });

    // Обновляем счетчик при загрузке
    updateRowCount();

    // Применение изменений
    const applyBtn = modal.querySelector('#tariff-apply-btn');
    applyBtn.addEventListener('click', async () => {
      // Фильтруем удаленные строки
      const activeData = importData.filter((row, index) => !deletedRows.has(index));
      
      if (activeData.length === 0) {
        alert('Нет активных записей для применения. Восстановите хотя бы одну строку.');
        return;
      }

      const confirmed = confirm(
        `Будет обработано ${activeData.length} записей (из ${importData.length} всего).\n\n` +
        `Продолжить?`
      );

      if (!confirmed) return;

      applyBtn.disabled = true;
      applyBtn.textContent = 'Применение...';

      // Закрываем модальное окно
      if (typeof $ !== 'undefined' && $.fn.modal) {
        $(modal).modal('hide');
      }

      // Показываем прогресс
      const progressModal = createProgressModal();
      document.body.appendChild(progressModal);
      if (typeof $ !== 'undefined' && $.fn.modal) {
        $(progressModal).modal('show');
      }

      const result = await applyCSVData(activeData, (processed, total, name, result) => {
        const percent = Math.round((processed / total) * 100);
        const progressBar = progressModal.querySelector('.progress-bar');
        const progressText = progressModal.querySelector('.progress-text');
        
        if (progressBar) progressBar.style.width = percent + '%';
        if (progressText) progressText.textContent = `Обработано: ${processed} из ${total} - ${name}`;
      });

      // Закрываем прогресс
      if (typeof $ !== 'undefined' && $.fn.modal) {
        $(progressModal).modal('hide');
      }
      progressModal.remove();

      // Показываем результат
      let message = `<strong>Готово!</strong><br>Успешно: ${result.successCount} из ${result.total}`;
      if (result.errorCount > 0) {
        message += `<br>Ошибок: ${result.errorCount}`;
      }
      if (result.skippedCount > 0) {
        message += `<br>Пропущено: ${result.skippedCount}`;
      }

      alert(message);

      // Перезагружаем страницу
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });

    // Функция закрытия модального окна
    const closeModal = () => {
      if (typeof $ !== 'undefined' && $.fn.modal) {
        $(modal).modal('hide');
        $(modal).one('hidden.bs.modal', () => {
          cleanupModal(modal);
        });
      } else {
        cleanupModal(modal);
      }
    };

    // Обработчик для крестика
    const closeBtn = modal.querySelector('.tariff-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      });
    }

    // Обработчик для кнопки "Отмена"
    const cancelBtn = modal.querySelector('.tariff-modal-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      });
    }

    // Закрытие по клику на backdrop
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Закрытие по ESC
    const handleEsc = (e) => {
      if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeModal();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);

    // Показываем модальное окно
    if (typeof $ !== 'undefined' && $.fn.modal) {
      // Используем Bootstrap modal
      $(modal).modal({
        backdrop: true,
        keyboard: true,
        show: true
      });
    } else {
      // Создаем backdrop вручную
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade';
      backdrop.id = 'tariff-modal-backdrop';
      backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        z-index: 1040;
        width: 100vw;
        height: 100vh;
        background-color: #000;
      `;
      document.body.appendChild(backdrop);
      
      // Анимация появления backdrop
      requestAnimationFrame(() => {
        backdrop.classList.add('show');
        backdrop.style.opacity = '0.5';
      });
      
      // Показываем модальное окно
      modal.style.cssText = `
        display: block !important;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 1050;
        width: 100%;
        height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
        outline: 0;
      `;
      
      requestAnimationFrame(() => {
        modal.classList.add('show');
      });
      
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      
      // Вычисляем ширину скроллбара и компенсируем
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = scrollbarWidth + 'px';
      }
    }
  }

  // Создаем модальное окно прогресса
  function createProgressModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('data-backdrop', 'static');
    modal.setAttribute('data-keyboard', 'false');

    modal.innerHTML = `
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Применение изменений</h5>
          </div>
          <div class="modal-body">
            <div class="progress">
              <div class="progress-bar" role="progressbar" style="width: 0%"></div>
            </div>
            <div class="progress-text" style="margin-top: 10px; text-align: center;"></div>
          </div>
        </div>
      </div>
    `;

    return modal;
  }

  // Экранирование HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Ждем загрузки данных
  function waitForTariffData(callback, maxAttempts = 20) {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      
      const cells = document.querySelectorAll('.tableTimeRuler .cell[onclick*="editTimePeriod"]');
      
      if (cells.length > 0 || attempts >= maxAttempts) {
        callback();
        return;
      }
      
      setTimeout(check, 500);
    };
    
    check();
  }

  // Инициализация
  function init() {
    if (!isTariffPage()) {
      return;
    }

    const initUI = () => {
      waitForTariffData(() => {
        createCSVImportExportUI();
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initUI);
    } else {
      initUI();
    }
  }

  init();

})();

