// geojson.js - Load và xử lý dữ liệu GeoJSON
let geoJsonLayer = null;
let geoJsonData = null; // Lưu trữ dữ liệu GeoJSON gốc
let allFeatures = []; // Lưu trữ tất cả các feature để tìm kiếm
let searchResults = []; // Lưu trữ kết quả tìm kiếm
let highlightedLayer = null; // Layer được highlight khi tìm kiếm

function normalizeText(value) {
    if (value === undefined || value === null) return '';
    return value.toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function findFieldName(headers, patterns) {
    const normalized = headers.map(header => normalizeText(header));
    for (const pattern of patterns) {
        const index = normalized.findIndex(value => value.includes(pattern));
        if (index !== -1) {
            return headers[index];
        }
    }
    return null;
}

function buildIntroductionMap(rows) {
    if (!rows || !rows.length) return null;
    const headers = Object.keys(rows[0]);
    const sttField = findFieldName(headers, ['stt', 'so thu tu', 'số thứ tự', 'id', 'ma', 'mã', 'ma so', 'mã số']);
    const nameField = findFieldName(headers, ['ten_xa', 'tenxa', 'ten phuong', 'ten phường', 'ten xa', 'ten xã', 'name', 'phuong', 'xa']);
    let introField = findFieldName(headers, ['gioithieu', 'gioi thieu', 'gioi', 'introdu', 'thieu', 'gioithie', 'gioithieulie']);
    if (!introField) {
        introField = headers.find(h => {
            const normalized = normalizeText(h);
            return normalized.includes('gioi') && normalized.includes('thieu');
        }) || null;
    }

    if ((!sttField && !nameField) || !introField) {
        console.warn('Không tìm thấy cột STT/khóa hoặc cột giới thiệu trong file Excel', { sttField, nameField, introField, headers });
        return null;
    }

    const map = {};
    rows.forEach(row => {
        let key = '';
        if (sttField && row[sttField] !== undefined && row[sttField] !== null && String(row[sttField]).trim() !== '') {
            key = String(row[sttField]).trim();
        } else if (nameField) {
            key = normalizeText(row[nameField]);
        }
        if (!key) return;
        const intro = row[introField];
        if (intro !== undefined && intro !== null && intro !== '') {
            map[key] = intro;
        }
    });
    return map;
}

function findIntroductionKey(feature, introMap) {
    if (!feature || !feature.properties) return null;

    const sttValue = feature.properties.stt || feature.properties.STT || feature.properties.id || feature.properties.ID;
    if (sttValue !== undefined && sttValue !== null && String(sttValue).trim() !== '') {
        const sttKey = String(sttValue).trim();
        if (introMap[sttKey]) {
            return sttKey;
        }
    }

    const keys = [
        feature.properties.ten_xa,
        feature.properties.TenXa,
        feature.properties.ten_phuong,
        feature.properties.TenPhuong,
        feature.properties.name,
        feature.properties.NAME,
        feature.properties.Ten,
        feature.properties.TEN
    ].map(normalizeText).filter(Boolean);

    for (const key of keys) {
        if (introMap[key]) {
            return key;
        }
    }

    const featureText = keys.join(' ');
    for (const introKey of Object.keys(introMap)) {
        if (!introKey) continue;
        if (featureText.includes(introKey) || introKey.includes(featureText)) {
            return introKey;
        }
    }

    return null;
}

async function loadIntroductionData() {
    try {
        const response = await fetch('Phuong_xa_gthieu.xlsx');
        if (!response.ok) {
            throw new Error('Không thể tải file Excel giới thiệu');
        }
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            throw new Error('Không tìm thấy sheet trong file Excel');
        }
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
        const introMap = buildIntroductionMap(rows) || {};
        console.log('Loaded Excel intro rows:', rows.length, 'introMap keys:', Object.keys(introMap).length);
        return introMap;
    } catch (error) {
        console.warn('Lỗi khi đọc Phuong_xa_gthieu.xlsx:', error);
        return {};
    }
}

// Hàm load và hiển thị GeoJSON
function loadGeoJSON() {
    // Xóa layer cũ nếu có
    if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
    }

    // Load file GeoJSON và dữ liệu giới thiệu từ Excel
    const geoJsonPromise = fetch('HCM_Phuongxa_update.json').then(response => response.json());
    const introPromise = loadIntroductionData();

    Promise.all([geoJsonPromise, introPromise])
        .then(([data, introMap]) => {
            // Gắn phần giới thiệu vào từng feature nếu có dữ liệu từ Excel
                    console.log('Loaded introMap key count:', Object.keys(introMap).length);
            if (introMap && Object.keys(introMap).length) {
                (data.features || []).forEach(feature => {
                    if (!feature.properties) return;
                    const matchKey = findIntroductionKey(feature, introMap);
                    if (matchKey) {
                        feature.properties.Gioithieu = introMap[matchKey];
                    }
                });
            } else {
                console.warn('Không tìm được dữ liệu giới thiệu từ file Excel hoặc file Excel không có cột phù hợp');
            }

            // Lưu trữ dữ liệu gốc
            geoJsonData = data;
            allFeatures = data.features || [];
            // Tạo style cho các feature
            function style(feature) {
                return {
                    fillColor: getColor(feature),
                    weight: 2,
                    opacity: 1,
                    color: 'rgba(154, 152, 152, 0.99)',
                    dashArray: '3',
                    fillOpacity: 0.75
                };
            }

            // Hàm tạo màu ngẫu nhiên hoặc theo thuộc tính
            function getColor(feature) {
                // Có thể tùy chỉnh màu theo thuộc tính của feature
                // Ví dụ: theo tên quận/huyện
                const colors = [
                    'rgba(166, 163, 163, 0)'
                ];
                // Sử dụng hash đơn giản để tạo màu ổn định
                if (feature.properties) {
                    const name = feature.properties.name || feature.properties.NAME || '';
                    const hash = name.split('').reduce((acc, char) => {
                        return char.charCodeAt(0) + ((acc << 5) - acc);
                    }, 0);
                    return colors[Math.abs(hash) % colors.length];
                }
                return '#3388ff';
            }

            // Tạo popup cho mỗi feature
            function onEachFeature(feature, layer) {
                if (feature.properties) {
                    let popupContent = '<div style="max-width: 400px;">';

                    // Chỉ hiển thị các trường được chỉ định với label Tiếng Việt
                    const fieldLabels = {
                        'ten_xa': 'Tên Phường/Xã',
                        'sap_nhap': 'Sáp nhập từ',
                        'loai': 'Loại',
                        'Gioithieu': 'Giới thiệu',
                        'gioithieu': 'Giới thiệu'
                    };
                    
                    for (let field in fieldLabels) {
                        if (feature.properties[field] !== undefined && feature.properties[field] !== '') {
                            popupContent += `<strong>${fieldLabels[field]}:</strong> ${feature.properties[field]}<br>`;
                        }
                    }

                    popupContent += '</div>';
                    const finalPopupContent = (typeof buildScrollablePopupContent === 'function')
                        ? buildScrollablePopupContent(popupContent, 150)
                        : popupContent;
                    layer.bindPopup(finalPopupContent);

                    // Thêm tooltip - ưu tiên hiển thị ten_xa
                    const tooltipText = feature.properties.ten_xa ||
                                       feature.properties.TenXa ||
                                       feature.properties.ten_phuong ||
                                       feature.properties.TenPhuong ||
                                       feature.properties.name ||
                                       feature.properties.NAME ||
                                       feature.properties.Ten ||
                                       'Không có tên';
                    layer.bindTooltip(tooltipText, {
                        permanent: false,
                        direction: 'center',
                        className: 'geojson-tooltip'
                    });
                }

                // Highlight khi hover
                layer.on({
                    mouseover: function(e) {
                        const layer = e.target;
                        layer.setStyle({
                            weight: 4,
                            color: 'rgba(26, 72, 181, 0.67)',
                            dashArray: '',
                            fillOpacity: 0.9
                        });
                        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                            layer.bringToFront();
                        }

                        // Hiển thị thông tin ten_xa trong panel thông tin
                        const props = layer.feature.properties;
                        const tenXa = props.ten_xa || props.TenXa || props.ten_phuong || props.TenPhuong || 'Không có tên';
                        updateInfo(`<strong>Tên xã/phường:</strong> ${tenXa}`);
                    },
                    mouseout: function(e) {
                        geoJsonLayer.resetStyle(e.target);
                        // Xóa thông tin khi rời chuột (tùy chọn)
                        // updateInfo('Di chuyển chuột vào đối tượng để xem thông tin');
                    },
                    click: function(e) {
                        map.fitBounds(e.target.getBounds());
                        const props = e.target.feature.properties;
                        let info = 'Thông tin khu vực:<br>';
                        for (let key in props) {
                            if (props.hasOwnProperty(key)) {
                                info += `<strong>${key}:</strong> ${props[key]}<br>`;
                            }
                        }
                        updateInfo(info);
                        
               
                        e.target.setStyle({
                            weight: 2,
                            color: '#fff',
                            dashArray: '3'
                        });
                        
                        // Loại bỏ focus outline
                        if (e.target._path) {
                            e.target._path.blur();
                            e.target._path.style.outline = 'none';
                        }
                    }
                });
            }

            // Tạo GeoJSON layer
            geoJsonLayer = L.geoJSON(data, {
                pane: 'geoJsonPane',
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map);
            
            // Atualizar a referência global após o layer ser criado
            window.geoJsonLayer = geoJsonLayer;
            if (typeof bringTrusoToFront === 'function') {
                bringTrusoToFront();
            }

            // Fit map để hiển thị toàn bộ dữ liệu (ưu tiên gom bounds từ nhiều lớp)
            if (typeof fitMapToAllData === 'function') {
                fitMapToAllData();
            } else {
                map.fitBounds(geoJsonLayer.getBounds());
            }

            // Cập nhật thông tin
            const featureCount = data.features ? data.features.length : 0;
            updateInfo(`Đã tải ${featureCount} đối tượng từ file GeoJSON`);
        })
        .catch(error => {
            console.error('Lỗi khi load GeoJSON:', error);
            updateInfo('Lỗi khi tải file GeoJSON. Vui lòng kiểm tra đường dẫn file.');
        });
}

// Tự động load GeoJSON khi trang được tải
loadGeoJSON();

// Hàm toggle hiển thị GeoJSON - Trả về trạng thái hiển thị
function toggleGeoJSON() {
    if (!geoJsonLayer) {
        updateInfo('Đang tải GeoJSON, vui lòng đợi...');
        console.log('geoJsonLayer is null or undefined');
        return false;
    }
    
    const isVisible = map.hasLayer(geoJsonLayer);
    
    if (isVisible) {
        map.removeLayer(geoJsonLayer);
        updateInfo('Đã ẩn ranh giới phường/xã');
        console.log('GeoJSON layer removed');
        return false;
    } else {
        map.addLayer(geoJsonLayer);
        // Đảm bảo Truso layer vẫn ở trên top khi GeoJSON được thêm lại
        if (typeof bringTrusoToFront === 'function') {
            bringTrusoToFront();
        }
        updateInfo('Đã hiển thị ranh giới phường/xã');
        console.log('GeoJSON layer added');
        return true;
    }
}

// Export các biến và hàm
window.geoJsonLayer = geoJsonLayer;
window.geoJsonData = geoJsonData;
window.allFeatures = allFeatures;
window.searchResults = searchResults;
window.highlightedLayer = highlightedLayer;
window.loadGeoJSON = loadGeoJSON;
window.toggleGeoJSON = toggleGeoJSON;

