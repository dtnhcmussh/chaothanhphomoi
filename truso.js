// truso.js - Load va xu ly du lieu Tru so
let trusoLayer = null;
let trusoData = null;

// Dua lop Tru so len tren cung so voi cac lop vector khac
function bringTrusoToFront() {
    if (trusoLayer && map.hasLayer(trusoLayer)) {
        trusoLayer.bringToFront();
    }
}

// Ham load va hien thi Tru so data
function loadTrusoData() {
    // Xoa layer cu neu co
    if (trusoLayer) {
        map.removeLayer(trusoLayer);
    }

    // Load file Truso.json
    return fetch('Truso.json')
        .then(response => response.json())
        .then(data => {
            trusoData = data;

            function onEachFeature(feature, layer) {
                if (feature.properties) {
                    let popupContent = '<div style="max-width: 300px;">';
                    const props = feature.properties;
                    const ten = props.Ten || 'Khong xac dinh';
                    const loai = props.Loai || 'Khong xac dinh';
                    const diachi = props.Diachi || '';
                    const tenHienThi = `${ten} (${loai})`;
                    const lat = feature.geometry.coordinates[1];
                    const lng = feature.geometry.coordinates[0];
                    
                    // Escape single quotes cho onclick handler
                    const tenEscaped = ten.replace(/'/g, "\\'");
                    const loaiEscaped = loai.replace(/'/g, "\\'");
                    const diachiEscaped = diachi.replace(/'/g, "\\'");

                    popupContent += `<strong style="color: #d9534f;">${ten}</strong><br>`;
                    popupContent += `<small><strong>Loại:</strong> ${loai}</small><br>`;
                    if (diachi) {
                        popupContent += `<small><strong>Địa chỉ:</strong> ${diachi}</small><br>`;
                    }
                    popupContent += `<small><strong>Tọa độ:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</small><br>`;
                    popupContent += `<button class="btn-comment-truso" style="margin-top: 8px; width: 100%; padding: 6px; background: #d9534f; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;" onclick="openTrusoCommentModal('${tenEscaped}', '${loaiEscaped}', '${diachiEscaped}', ${lat}, ${lng})">
                        <span class="truso-comment-icon" aria-hidden="true"></span>Nhận xét
                    </button>`;
                    popupContent += '</div>';
                    const finalPopupContent = (typeof buildScrollablePopupContent === 'function')
                        ? buildScrollablePopupContent(popupContent, 150)
                        : popupContent;
                    layer.bindPopup(finalPopupContent);

                    layer.bindTooltip(tenHienThi, {
                        permanent: false,
                        direction: 'top',
                        offset: L.point(0, -10)
                    });
                }
            }

            trusoLayer = L.geoJSON(data, {
                pane: 'trusoPane',
                pointToLayer: function(feature, latlng) {
                    return L.circleMarker(latlng, {
                        pane: 'trusoPane',
                        radius: 6,
                        fillColor: '#d9534f',
                        color: '#d9534f',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.7
                    });
                },
                onEachFeature: onEachFeature
            }).addTo(map);

            bringTrusoToFront();

            if (typeof fitMapToAllData === 'function') {
                fitMapToAllData();
            }

            // Cap nhat global refs sau khi tao layer moi
            window.trusoLayer = trusoLayer;
            window.trusoData = trusoData;

            const featureCount = data.features ? data.features.length : 0;
            updateInfo(`Da tai ${featureCount} tru so tu Truso.json`);
            return trusoLayer;
        })
        .catch(error => {
            console.error('Loi khi load Truso.json:', error);
            updateInfo('Loi khi tai file Truso.json. Vui long kiem tra duong dan file.');
            return null;
        });
}

// Ham toggle hien thi Tru so layer - tra ve trang thai hien thi
function toggleTrusoLayer() {
    if (!trusoLayer) {
        loadTrusoData();
        return true;
    }

    const isVisible = map.hasLayer(trusoLayer);

    if (isVisible) {
        map.removeLayer(trusoLayer);
        updateInfo('Da an lop tru so');
        return false;
    }

    map.addLayer(trusoLayer);
    bringTrusoToFront();
    updateInfo('Da hien thi lop tru so');
    return true;
}

// Tu dong load Tru so data khi trang duoc tai
loadTrusoData();

// Export bien va ham
window.trusoLayer = trusoLayer;
window.trusoData = trusoData;
window.loadTrusoData = loadTrusoData;
window.toggleTrusoLayer = toggleTrusoLayer;
window.bringTrusoToFront = bringTrusoToFront;
