// geojson.js - Load và xử lý dữ liệu GeoJSON
let geoJsonLayer = null;
let geoJsonData = null; // Lưu trữ dữ liệu GeoJSON gốc
let allFeatures = []; // Lưu trữ tất cả các feature để tìm kiếm
let searchResults = []; // Lưu trữ kết quả tìm kiếm
let highlightedLayer = null; // Layer được highlight khi tìm kiếm

// Hàm load và hiển thị GeoJSON
function loadGeoJSON() {
    // Xóa layer cũ nếu có
    if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
    }

    // Load file GeoJSON
    fetch('HCM_PhuongXa.geojson')
        .then(response => response.json())
        .then(data => {
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
                    'rgba(166, 163, 163, 0)', '#4ECDC4', '#45B7D1', '#FFA07A',
                    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
                    '#F8B739', '#6C5CE7', '#A29BFE', '#FD79A8'
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
                        'Gioithieu': 'Giới thiệu'
                    };
                    
                    for (let field in fieldLabels) {
                        if (feature.properties[field] !== undefined) {
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

            // Fit map to bounds của GeoJSON
            map.fitBounds(geoJsonLayer.getBounds());

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

