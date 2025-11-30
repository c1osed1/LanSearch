/**
 * Логика для массового изменения цен в тарифах
 */

(function() {
  'use strict';


  function isTariffPage() {
    const path = window.location.pathname;
    return path.includes('/tariff/') || path.includes('/tariff');
  }


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


  function extractCellData(cell) {
    const onclick = cell.getAttribute('onclick');
    if (!onclick) return null;


    const match = onclick.match(/editTimePeriod\((\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
    if (!match) return null;

    const id = parseInt(match[1]);
    const priceText = cell.textContent.trim();
    const price = parseFloat(priceText) || parseFloat(match[2]) || null;


    const wrapper = cell.closest('.time-ruler-wrapper');
    const clubId = wrapper ? wrapper.getAttribute('data-club') : null;
    const zoneId = wrapper ? wrapper.getAttribute('data-zone') : null;





    return {
      id: id,
      price: price,
      clubId: clubId,
      zoneId: zoneId,
      cell: cell
    };
  }



  function findCellsWithPrice(targetPrice) {


    const timeRulers = document.querySelectorAll('.tableTimeRuler');
    const matchingCells = [];
    const processedIds = new Set(); // Для отслеживания уже обработанных ID

    timeRulers.forEach((ruler, index) => {


      const cells = ruler.querySelectorAll('.cell[onclick*="editTimePeriod"]');
      
      cells.forEach(cell => {
        const cellData = extractCellData(cell);
        if (cellData && cellData.price !== null && cellData.id) {

          if (Math.abs(cellData.price - targetPrice) < 0.01 && !processedIds.has(cellData.id)) {


            const onclick = cell.getAttribute('onclick');
            if (onclick && onclick.includes(',')) {
              matchingCells.push(cellData);
              processedIds.add(cellData.id);
            }
          }
        }
      });
    });

    return matchingCells;
  }


  async function getPeriodFullData(periodId) {



    

    const cell = document.querySelector(`.cell[onclick*="editTimePeriod(${periodId}"]`);
    if (!cell) return null;

    const cellData = extractCellData(cell);
    if (!cellData) return null;




    return cellData;
  }


  async function updatePrice(periodData, newPrice, typeGroupId) {
    const url = '/tariff/crud.php';
    



    



    


    const formData = new URLSearchParams({
      action: 'edit_time_period',
      type_group_id: typeGroupId,
      id: periodData.id,
      club_id: periodData.clubId || '',
      zone_id: periodData.zoneId || '',
      time_from: '00:00', // Нужно получить из реальных данных
      time_to: '23:59',   // Нужно получить из реальных данных
      visible_time_from: '00:00', // Нужно получить из реальных данных
      visible_time_to: '23:59',  // Нужно получить из реальных данных
      price: newPrice,
      reactive: '1'
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: formData.toString()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Ошибка при обновлении цены:', error);
      return { code: -1, error: error.message };
    }
  }

  // Полностью закрываем и очищаем модальное окно
  function closeModalCompletely(modal) {
    return new Promise((resolve) => {
      // Используем jQuery если доступен
      if (typeof $ !== 'undefined' && $.fn.modal) {
        $(modal).modal('hide');
        $(modal).one('hidden.bs.modal', function() {
          cleanupModal(modal);
          resolve();
        });
        // Таймаут на случай, если событие не сработает
        setTimeout(() => {
          cleanupModal(modal);
          resolve();
        }, 500);
      } else {
        // Нативный способ
        const closeBtn = modal.querySelector('button[data-dismiss="modal"]');
        if (closeBtn) {
          closeBtn.click();
        }
        
        // Принудительная очистка
        setTimeout(() => {
          cleanupModal(modal);
          resolve();
        }, 300);
      }
    });
  }

  // Очистка модального окна и backdrop
  function cleanupModal(modal) {
    // Удаляем все backdrop элементы
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    
    // Убираем классы и стили с модального окна
    modal.classList.remove('show', 'fade', 'in');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('aria-modal');
    
    // Убираем класс с body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  async function getPeriodDataViaModal(periodId) {
    return new Promise(async (resolve) => {
      // Сначала убеждаемся, что предыдущее модальное окно полностью закрыто
      const existingModal = document.querySelector('#editTimePeriodModal');
      if (existingModal) {
        const isOpen = existingModal.classList.contains('show') || 
                      window.getComputedStyle(existingModal).display !== 'none' ||
                      document.querySelector('.modal-backdrop');
        
        if (isOpen) {
          await closeModalCompletely(existingModal);
          // Ждем еще немного перед следующим открытием
          await new Promise(r => setTimeout(r, 400));
        } else {
          // Очищаем даже если кажется закрытым
          cleanupModal(existingModal);
          await new Promise(r => setTimeout(r, 200));
        }
      }

      const cells = document.querySelectorAll(`.cell[onclick*="editTimePeriod(${periodId}"]`);
      let cell = null;

      // Ищем ячейку, где цена передается как параметр (первая таблица)
      for (const c of cells) {
        const onclick = c.getAttribute('onclick');
        if (onclick && onclick.includes(',')) {
          cell = c;
          break;
        }
      }

      // Если не нашли, берем первую попавшуюся
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
            const data = {
              id: idValue,
              club_id: form.querySelector('input[name="club_id"]')?.value,
              zone_id: form.querySelector('input[name="zone_id"]')?.value,
              time_from: form.querySelector('input[name="time_from"]')?.value,
              time_to: form.querySelector('input[name="time_to"]')?.value,
              visible_time_from: form.querySelector('input[name="visible_time_from"]')?.value,
              visible_time_to: form.querySelector('input[name="visible_time_to"]')?.value,
              price: form.querySelector('input[name="price"]')?.value,
              type_group_id: form.querySelector('input[name="type_group_id"]')?.value
            };
            

            if (data.time_from && data.time_to && data.visible_time_from && data.visible_time_to) {
              return data;
            }
          }
        }
        return null;
      };

      const onModalShown = () => {
        if (resolved) return;
        

        let attempts = 0;
        const maxAttempts = 30; // 3 секунды при интервале 100мс
        
        const checkData = setInterval(() => {
          attempts++;
          const data = extractData();
          
          if (data) {
            clearInterval(checkData);
            modalData = data;
            resolved = true;
            

            // Закрываем модальное окно полностью
            closeModalCompletely(modal).then(() => {
              // Небольшая задержка перед разрешением промиса
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
      const maxChecks = 50; // 5 секунд при интервале 100мс
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


  async function getPeriodDataViaAPI(periodId, clubId, zoneId) {



    return null;
  }


  // Обновляем выбранные цены (режим с чекбоксами)
  async function updateSelectedPrices(selectedCells, newPrice, typeGroupId, onProgress) {
    if (selectedCells.length === 0) {
      return { success: false, message: 'Не выбрано ни одной ячейки' };
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Группируем по уникальным ID, чтобы не обновлять один и тот же период несколько раз
    const uniquePeriods = new Map();
    selectedCells.forEach(cellData => {
      if (cellData.id && !uniquePeriods.has(cellData.id)) {
        uniquePeriods.set(cellData.id, cellData);
      }
    });

    const total = uniquePeriods.size;
    let processed = 0;

    for (const [periodId, cellData] of uniquePeriods) {
      // Получаем полные данные периода
      let periodData = await getPeriodDataViaModal(periodId);
      
      if (!periodData) {
        periodData = await getPeriodDataViaAPI(periodId, cellData.clubId, cellData.zoneId);
      }
      
      if (!periodData) {
        console.warn(`Не удалось получить данные для периода ${periodId}, пропускаем`);
        skippedCount++;
        processed++;
        if (onProgress) {
          onProgress(processed, total, periodId, { code: -1, message: 'Не удалось получить данные' });
        }
        continue;
      }

      if (!periodData.type_group_id) {
        periodData.type_group_id = typeGroupId;
      }

      if (!periodData.time_from || !periodData.time_to || !periodData.visible_time_from || !periodData.visible_time_to) {
        console.warn(`Неполные данные для периода ${periodId}, пропускаем`);
        skippedCount++;
        processed++;
        if (onProgress) {
          onProgress(processed, total, periodId, { code: -1, message: 'Неполные данные периода' });
        }
        continue;
      }

      const result = await updatePriceWithFullData(periodData, newPrice);
      
      results.push({
        periodId: periodId,
        result: result
      });

      if (result.code === 13 || result.code === '13') {
        successCount++;
      } else {
        errorCount++;
        console.error(`Ошибка обновления периода ${periodId}:`, result);
      }

      processed++;
      if (onProgress) {
        onProgress(processed, total, periodId, result);
      }

      await new Promise(resolve => setTimeout(resolve, 800));
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

  async function updateAllPrices(oldPrice, newPrice, typeGroupId, onProgress) {
    const cells = findCellsWithPrice(oldPrice);
    
    if (cells.length === 0) {
      return { success: false, message: 'Не найдено ячеек с указанной ценой' };
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;


    const uniquePeriods = new Map();
    cells.forEach(cellData => {
      if (!uniquePeriods.has(cellData.id)) {
        uniquePeriods.set(cellData.id, cellData);
      }
    });

    const total = uniquePeriods.size;
    let processed = 0;

    for (const [periodId, cellData] of uniquePeriods) {

      let periodData = await getPeriodDataViaModal(periodId);
      
      if (!periodData) {

        periodData = await getPeriodDataViaAPI(periodId, cellData.clubId, cellData.zoneId);
      }
      
      if (!periodData) {

        console.warn(`Не удалось получить данные для периода ${periodId}, пропускаем`);
        skippedCount++;
        processed++;
        if (onProgress) {
          onProgress(processed, total, periodId, { code: -1, message: 'Не удалось получить данные' });
        }
        continue;
      }


      if (!periodData.type_group_id) {
        periodData.type_group_id = typeGroupId;
      }


      if (!periodData.time_from || !periodData.time_to || !periodData.visible_time_from || !periodData.visible_time_to) {
        console.warn(`Неполные данные для периода ${periodId}, пропускаем`);
        skippedCount++;
        processed++;
        if (onProgress) {
          onProgress(processed, total, periodId, { code: -1, message: 'Неполные данные периода' });
        }
        continue;
      }


      const result = await updatePriceWithFullData(periodData, newPrice);
      
      results.push({
        periodId: periodId,
        result: result
      });

      if (result.code === 13 || result.code === '13') {
        successCount++;
      } else {
        errorCount++;
        console.error(`Ошибка обновления периода ${periodId}:`, result);
      }

      processed++;
      if (onProgress) {
        onProgress(processed, total, periodId, result);
      }


      // Увеличиваем задержку между запросами, чтобы дать время модальному окну полностью закрыться
      await new Promise(resolve => setTimeout(resolve, 800));
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


  async function updatePriceWithFullData(periodData, newPrice) {
    const url = '/tariff/crud.php';
    
    const formData = new URLSearchParams({
      action: 'edit_time_period',
      type_group_id: periodData.type_group_id,
      id: periodData.id,
      club_id: periodData.club_id,
      zone_id: periodData.zone_id,
      time_from: periodData.time_from,
      time_to: periodData.time_to,
      visible_time_from: periodData.visible_time_from,
      visible_time_to: periodData.visible_time_to,
      price: newPrice,
      reactive: '1'
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: formData.toString()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Ошибка при обновлении цены:', error);
      return { code: -1, error: error.message };
    }
  }


  function createBulkPriceUpdateUI() {

    const h5Elements = document.querySelectorAll('h5');
    let targetH5 = null;

    for (const h5 of h5Elements) {
      if (h5.textContent.includes('Настройка пакета')) {
        targetH5 = h5;
        break;
      }
    }

    if (!targetH5) {
      console.log('Не найден заголовок "Настройка пакета"');
      return;
    }


    const container = document.createElement('div');
    container.className = 'bulk-price-update-container';
    container.style.cssText = `
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
      background-color: #f9f9f9;
    `;

    container.innerHTML = `
      <h6 style="margin-top: 0;">Массовое изменение цены</h6>
      <div style="margin-bottom: 15px;">
        <label style="margin-right: 15px;">
          <input type="radio" name="bulk-price-mode" value="auto" checked style="margin-right: 5px;">
          По цене (автоматический поиск)
        </label>
        <label>
          <input type="radio" name="bulk-price-mode" value="manual" style="margin-right: 5px;">
          Выборочное (с чекбоксами)
        </label>
      </div>
      <div class="bulk-mode-auto">
        <div class="row" style="margin-bottom: 10px;">
          <div class="col-md-6">
            <label>Текущая цена:</label>
            <input type="number" class="form-control bulk-price-old" step="0.01" placeholder="150">
          </div>
          <div class="col-md-6">
            <label>Новая цена:</label>
            <input type="number" class="form-control bulk-price-new" step="0.01" placeholder="160">
          </div>
        </div>
      </div>
      <div class="bulk-mode-manual" style="display: none;">
        <div class="row" style="margin-bottom: 10px;">
          <div class="col-md-12">
            <label>Новая цена:</label>
            <input type="number" class="form-control bulk-price-new-manual" step="0.01" placeholder="160">
          </div>
        </div>
        <div style="margin-bottom: 10px; font-size: 12px; color: #666;">
          Отметьте нужные ячейки с ценами галочками, затем введите новую цену и нажмите "Обновить"
        </div>
      </div>
      <button class="btn btn-primary bulk-price-update-btn" style="width: 100%;">
        Обновить все найденные цены
      </button>
      <div class="bulk-price-status" style="margin-top: 10px; display: none;"></div>
      <div class="bulk-price-progress" style="margin-top: 10px; display: none;">
        <div class="progress">
          <div class="progress-bar" role="progressbar" style="width: 0%"></div>
        </div>
        <div class="progress-text" style="margin-top: 5px; font-size: 12px;"></div>
      </div>
    `;


    targetH5.parentNode.insertBefore(container, targetH5.nextSibling);


    const updateBtn = container.querySelector('.bulk-price-update-btn');
    const oldPriceInput = container.querySelector('.bulk-price-old');
    const newPriceInput = container.querySelector('.bulk-price-new');
    const newPriceInputManual = container.querySelector('.bulk-price-new-manual');
    const statusDiv = container.querySelector('.bulk-price-status');
    const progressDiv = container.querySelector('.bulk-price-progress');
    const progressBar = progressDiv.querySelector('.progress-bar');
    const progressText = progressDiv.querySelector('.progress-text');
    const modeAuto = container.querySelector('.bulk-mode-auto');
    const modeManual = container.querySelector('.bulk-mode-manual');
    const modeRadios = container.querySelectorAll('input[name="bulk-price-mode"]');

    // Функция для добавления чекбоксов в ячейки
    function addCheckboxes() {
      // Ищем только в первой таблице "Время старта", чтобы избежать дублирования
      // Вторая таблица "Время начала отображения" показывает те же периоды
      const timeRulers = document.querySelectorAll('.tableTimeRuler');

      timeRulers.forEach((ruler, index) => {
        // Берем только первую таблицу в каждом блоке (Время старта)
        // Вторая таблица (Время начала отображения) пропускаем
        const cells = ruler.querySelectorAll('.cell[onclick*="editTimePeriod"]');
        
        cells.forEach(cell => {
          const onclick = cell.getAttribute('onclick');
          if (!onclick) return;
          
          // Проверяем, что это ячейка из первой таблицы (Время старта)
          // В первой таблице цена передается как второй параметр в onclick
          if (!onclick.includes(',')) return;
          
          // Проверяем, что чекбокс еще не добавлен
          if (cell.querySelector('.tariff-checkbox')) return;
          
          // Создаем чекбокс
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.className = 'tariff-checkbox';
          checkbox.style.cssText = `
            position: absolute;
            top: 5px;
            left: 5px;
            z-index: 10;
            width: 18px;
            height: 18px;
            cursor: pointer;
            background-color: white;
            border: 2px solid #007bff;
          `;
          
          // Делаем ячейку относительно позиционированной, если еще не так
          const currentPosition = window.getComputedStyle(cell).position;
          if (currentPosition === 'static') {
            cell.style.position = 'relative';
          }
          
          // Предотвращаем всплытие события при клике на чекбокс, чтобы не открывалось модальное окно
          checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
          });
          
          // Также предотвращаем всплытие при mousedown и mouseup
          checkbox.addEventListener('mousedown', (e) => {
            e.stopPropagation();
          });
          
          checkbox.addEventListener('mouseup', (e) => {
            e.stopPropagation();
          });
          
          // Добавляем чекбокс
          cell.appendChild(checkbox);
        });
      });
    }

    // Функция для удаления чекбоксов
    function removeCheckboxes() {
      const checkboxes = document.querySelectorAll('.tariff-checkbox');
      checkboxes.forEach(checkbox => checkbox.remove());
    }

    // Переключатель режимов
    modeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.value === 'auto') {
          modeAuto.style.display = 'block';
          modeManual.style.display = 'none';
          updateBtn.textContent = 'Обновить все найденные цены';
          removeCheckboxes();
        } else {
          modeAuto.style.display = 'none';
          modeManual.style.display = 'block';
          updateBtn.textContent = 'Обновить отмеченные цены';
          addCheckboxes();
        }
      });
    });

    // Функция для получения отмеченных ячеек
    function getCheckedCells() {
      const checkedCheckboxes = document.querySelectorAll('.tariff-checkbox:checked');
      const checkedCells = [];
      
      checkedCheckboxes.forEach(checkbox => {
        const cell = checkbox.closest('.cell');
        if (cell) {
          const cellData = extractCellData(cell);
          if (cellData) {
            checkedCells.push(cellData);
          }
        }
      });
      
      return checkedCells;
    }

    updateBtn.addEventListener('click', async () => {
      // Определяем режим
      let selectedMode = Array.from(modeRadios).find(r => r.checked)?.value || 'auto';
      
      if (selectedMode === 'manual') {
        // Режим с чекбоксами
        const newPrice = parseFloat(newPriceInputManual.value);
        
        if (isNaN(newPrice)) {
          statusDiv.style.display = 'block';
          statusDiv.className = 'bulk-price-status alert alert-danger';
          statusDiv.textContent = 'Пожалуйста, введите корректное значение новой цены';
          return;
        }

        const checkedCells = getCheckedCells();
        if (checkedCells.length === 0) {
          statusDiv.style.display = 'block';
          statusDiv.className = 'bulk-price-status alert alert-warning';
          statusDiv.textContent = 'Не выбрано ни одной ячейки для обновления';
          return;
        }

        // Подсчитываем уникальные периоды
        const uniquePeriodsSet = new Set();
        checkedCells.forEach(cell => {
          if (cell.id) {
            uniquePeriodsSet.add(cell.id);
          }
        });

        const confirmed = confirm(
          `Выбрано ${checkedCells.length} ячеек.\n` +
          `Уникальных периодов: ${uniquePeriodsSet.size}.\n` +
          `Будет обновлено ${uniquePeriodsSet.size} периодов на цену ${newPrice}.\n` +
          `${checkedCells.length > uniquePeriodsSet.size ? `\nПримечание: некоторые ячейки относятся к одному периоду, поэтому обновление будет выполнено ${uniquePeriodsSet.size} раз.` : ''}\n\n` +
          `Продолжить?`
        );

        if (!confirmed) return;

        updateBtn.disabled = true;
        updateBtn.textContent = 'Обновление...';
        statusDiv.style.display = 'none';
        progressDiv.style.display = 'block';

        const typeGroupId = getTypeGroupId();
        if (!typeGroupId) {
          statusDiv.style.display = 'block';
          statusDiv.className = 'bulk-price-status alert alert-danger';
          statusDiv.textContent = 'Не удалось определить ID группы тарифа';
          updateBtn.disabled = false;
          updateBtn.textContent = 'Обновить отмеченные цены';
          progressDiv.style.display = 'none';
          return;
        }

        // Обновляем только отмеченные периоды
        const result = await updateSelectedPrices(checkedCells, newPrice, typeGroupId, (processed, total, periodId, result) => {
          const percent = Math.round((processed / total) * 100);
          progressBar.style.width = percent + '%';
          progressText.textContent = `Обработано: ${processed} из ${total} (ID: ${periodId})`;
        });

        // Показываем результат
        progressDiv.style.display = 'none';
        statusDiv.style.display = 'block';

        if (result.success) {
          statusDiv.className = 'bulk-price-status alert alert-success';
          let message = `<strong>Готово!</strong><br>`;
          message += `Выбрано ячеек: ${checkedCells.length}<br>`;
          message += `Уникальных периодов: ${result.total}<br>`;
          message += `Успешно обновлено: ${result.successCount} из ${result.total}`;
          if (result.errorCount > 0) {
            message += `<br>Ошибок: ${result.errorCount}`;
          }
          if (result.skippedCount > 0) {
            message += `<br>Пропущено: ${result.skippedCount}`;
          }
          if (checkedCells.length > result.total) {
            message += `<br><small>Примечание: некоторые ячейки относились к одному периоду</small>`;
          }
          statusDiv.innerHTML = message;

          // Перезагружаем страницу через 2 секунды
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          statusDiv.className = 'bulk-price-status alert alert-danger';
          statusDiv.textContent = result.message || 'Произошла ошибка';
        }

        updateBtn.disabled = false;
        updateBtn.textContent = 'Обновить отмеченные цены';
        return;
      }
      
      // Режим автоматического поиска (старая логика)
      const oldPrice = parseFloat(oldPriceInput.value);
      const newPrice = parseFloat(newPriceInput.value);

      if (isNaN(oldPrice) || isNaN(newPrice)) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'bulk-price-status alert alert-danger';
        statusDiv.textContent = 'Пожалуйста, введите корректные значения цен';
        return;
      }

      if (oldPrice === newPrice) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'bulk-price-status alert alert-warning';
        statusDiv.textContent = 'Текущая и новая цены не должны совпадать';
        return;
      }


      const cells = findCellsWithPrice(oldPrice);
      if (cells.length === 0) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'bulk-price-status alert alert-warning';
        statusDiv.textContent = `Не найдено ячеек с ценой ${oldPrice}`;
        return;
      }


      const uniquePeriodsSet = new Set();
      cells.forEach(cell => {
        if (cell.id) {
          uniquePeriodsSet.add(cell.id);
        }
      });


      const confirmed = confirm(
        `Найдено ${cells.length} ячеек с ценой ${oldPrice}.\n` +
        `Уникальных периодов: ${uniquePeriodsSet.size}.\n` +
        `Все они будут обновлены на ${newPrice}.\n\n` +
        `Продолжить?`
      );

      if (!confirmed) return;


      updateBtn.disabled = true;
      updateBtn.textContent = 'Обновление...';
      statusDiv.style.display = 'none';
      progressDiv.style.display = 'block';

      const typeGroupId = getTypeGroupId();
      if (!typeGroupId) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'bulk-price-status alert alert-danger';
        statusDiv.textContent = 'Не удалось определить ID группы тарифа';
        updateBtn.disabled = false;
        updateBtn.textContent = 'Обновить все найденные цены';
        progressDiv.style.display = 'none';
        return;
      }


      const result = await updateAllPrices(oldPrice, newPrice, typeGroupId, (processed, total, periodId, result) => {
        const percent = Math.round((processed / total) * 100);
        progressBar.style.width = percent + '%';
        progressText.textContent = `Обработано: ${processed} из ${total} (ID: ${periodId})`;
      });


      progressDiv.style.display = 'none';
      statusDiv.style.display = 'block';

      if (result.success) {
        statusDiv.className = 'bulk-price-status alert alert-success';
        let message = `<strong>Готово!</strong><br>Успешно обновлено: ${result.successCount} из ${result.total}`;
        if (result.errorCount > 0) {
          message += `<br>Ошибок: ${result.errorCount}`;
        }
        if (result.skippedCount > 0) {
          message += `<br>Пропущено: ${result.skippedCount}`;
        }
        statusDiv.innerHTML = message;


        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        statusDiv.className = 'bulk-price-status alert alert-danger';
        statusDiv.textContent = result.message || 'Произошла ошибка';
      }

      updateBtn.disabled = false;
      selectedMode = Array.from(modeRadios).find(r => r.checked)?.value || 'auto';
      updateBtn.textContent = selectedMode === 'manual' ? 'Обновить отмеченные цены' : 'Обновить все найденные цены';
    });
  }


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


  function init() {
    if (!isTariffPage()) {
      return;
    }


    const initUI = () => {
      waitForTariffData(() => {
        createBulkPriceUpdateUI();
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

