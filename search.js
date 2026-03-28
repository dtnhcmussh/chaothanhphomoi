// search.js - Tính năng tìm kiếm và dropdown

// ===== TÍNH NĂNG TÌM KIẾM =====

// Hàm lấy tên từ feature properties
function getFeatureName(feature) {
    if (!feature.properties) return '';

    // Thử các trường có thể chứa tên
    const nameFields = ['name', 'NAME', 'Ten', 'TEN', 'Name', 'ten_phuong', 'TenPhuong', 'ten_xa', 'TenXa'];

    for (let field of nameFields) {
        if (feature.properties[field]) {
            return feature.properties[field].toString();
        }
    }

    return '';
}

function normalizeText(value) {
    return (value || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

// Hàm tìm kiếm feature theo tên
function searchFeatures(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
        return [];
    }

    const term = searchTerm.toLowerCase().trim();
    const normalizedTerm = normalizeText(term);
    const results = [];

    allFeatures.forEach((feature, index) => {
        const name = getFeatureName(feature);
        const normalizedName = normalizeText(name);

        if (normalizedName.includes(normalizedTerm)) {
            results.push({
                type: 'geojson',
                feature: feature,
                name: name,
                index: index
            });
        }
    });

    // Tìm kiếm thêm trong lớp trụ sở
    if (trusoData && Array.isArray(trusoData.features)) {
        trusoData.features.forEach((feature, index) => {
            const props = feature.properties || {};
            const ten = props.Ten || getFeatureName(feature);
            const loai = props.Loai || 'Khong xac dinh';
            const displayName = `${ten} (${loai})`;
            const normalizedName = normalizeText(displayName);

            if (normalizedName.includes(normalizedTerm)) {
                results.push({
                    type: 'truso',
                    feature: feature,
                    name: displayName,
                    index: index
                });
            }
        });
    }

    return results;
}

// Hàm highlight feature trên bản đồ
function highlightFeature(feature) {
    // Xóa highlight cũ
    clearHighlight();

    if (!geoJsonLayer) return;

    // Tìm layer tương ứng với feature
    geoJsonLayer.eachLayer(function(layer) {
        if (layer.feature === feature) {
            highlightedLayer = layer;

            // Highlight style - đổi màu thành màu xanh dương và tô viền đậm
            layer.setStyle({
                weight: 3,
                color: '#004aad',
                fillColor: '#004aad',
                fillOpacity: 0.9,
                dashArray: ''
            });

            // Zoom và mở popup
            if (layer.getBounds) {
                map.fitBounds(layer.getBounds(), {
                    padding: [50, 50],
                    maxZoom: 15
                });
            }

            // Mở popup
            if (layer.getPopup) {
                layer.openPopup();
            }
        }
    });
}

// Hàm xóa highlight
function clearHighlight() {
    if (highlightedLayer && geoJsonLayer) {
        geoJsonLayer.resetStyle(highlightedLayer);
        highlightedLayer = null;
    }
}

function openTrusoFeature(result) {
    const findAndOpenMarker = function() {
        if (!trusoLayer) return false;

        let matchedLayer = null;
        trusoLayer.eachLayer(function(layer) {
            if (layer.feature === result.feature) {
                matchedLayer = layer;
            }
        });

        if (!matchedLayer) return false;

        if (matchedLayer.getLatLng) {
            map.setView(matchedLayer.getLatLng(), Math.max(map.getZoom(), 15));
        }
        if (matchedLayer.openPopup) {
            matchedLayer.openPopup();
        }
        return true;
    };

    if (!trusoLayer || !map.hasLayer(trusoLayer)) {
        if (typeof loadTrusoData === 'function') {
            const loadResult = loadTrusoData();
            Promise.resolve(loadResult).then(() => {
                if (trusoLayer && !map.hasLayer(trusoLayer)) {
                    map.addLayer(trusoLayer);
                }
                bringTrusoToFront();
                findAndOpenMarker();
            });
            return;
        }
        if (typeof toggleTrusoLayer === 'function') {
            toggleTrusoLayer();
            setTimeout(() => {
                if (trusoLayer) {
                    findAndOpenMarker();
                }
            }, 200);
        }
        return;
    }

    findAndOpenMarker();
}

function focusSearchResult(result) {
    if (!result) return;

    if (result.type === 'truso') {
        clearHighlight();
        openTrusoFeature(result);
        return;
    }

    highlightFeature(result.feature);
}

// Hàm thực hiện tìm kiếm
function performSearch(searchTerm = null) {
    const searchInput = document.getElementById('searchInput');
    const term = (typeof searchTerm === 'string' ? searchTerm : searchInput.value);

    if (!term || term.trim() === '') {
        updateInfo('Vui lòng nhập từ khóa tìm kiếm');
        return;
    }

    // Tìm kiếm
    searchResults = searchFeatures(term);

    if (searchResults.length === 0) {
        updateInfo(`Không tìm thấy kết quả nào cho "${term}"`);
        clearHighlight();
        return;
    }

    // Hiển thị kết quả đầu tiên
    if (searchResults.length > 0) {
        focusSearchResult(searchResults[0]);

        // Hiển thị danh sách kết quả
        let resultText = `Tìm thấy ${searchResults.length} kết quả cho "${term}":<br>`;
        resultText += '<ul style="margin-top: 10px; padding-left: 20px;">';

        searchResults.slice(0, 10).forEach((result, index) => {
            resultText += `<li style="cursor: pointer; margin: 5px 0; padding: 5px; border-radius: 3px; background: ${index === 0 ? '#e3f2fd' : 'transparent'};"
                             onclick="selectSearchResult(${index})">${result.name}</li>`;
        });

        if (searchResults.length > 10) {
            resultText += `<li style="color: #666; font-style: italic;">... và ${searchResults.length - 10} kết quả khác</li>`;
        }

        resultText += '</ul>';
        updateInfo(resultText);
    }
}

// Hàm chọn kết quả tìm kiếm
function selectSearchResult(index) {
    if (index >= 0 && index < searchResults.length) {
        const result = searchResults[index];
        focusSearchResult(result);

        // Cập nhật thông tin
        let info = `Đã chọn: <strong>${result.name}</strong><br>`;
        const props = result.feature.properties;
        for (let key in props) {
            if (props.hasOwnProperty(key)) {
                info += `<strong>${key}:</strong> ${props[key]}<br>`;
            }
        }
        updateInfo(info);
    }
}

// Hàm xóa tìm kiếm
function clearSearch() {
    document.getElementById('searchInput').value = '';
    searchResults = [];
    clearHighlight();
    hideSearchDropdown();
    updateInfo('Đã xóa tìm kiếm');
}

// Alias cho clearSearch
function clearSearchResults() {
    clearSearch();
}

// Thêm event listeners cho tìm kiếm - xử lý nếu các element tồn tại
document.addEventListener('DOMContentLoaded', function() {
    const btnSearch = document.getElementById('btnSearch');
    const btnClearSearch = document.getElementById('btnClearSearch');
    const searchInput = document.getElementById('searchInput');
    
    if (btnSearch) {
        btnSearch.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            performSearch();
        });
    }
    
    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', clearSearch);
    }
    
    if (searchInput) {
        // Tìm kiếm khi nhấn Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // Xóa highlight khi người dùng bắt đầu gõ mới
        searchInput.addEventListener('input', function() {
            if (this.value.trim() === '') {
                clearHighlight();
                hideSearchDropdown();
            } else {
                handleSearchInput();
            }
        });
    }
});

// Export hàm selectSearchResult để có thể gọi từ HTML
window.selectSearchResult = selectSearchResult;

// ===== TÍNH NĂNG DROPDOWN TÌM KIẾM =====

// Biến cho dropdown
let currentSuggestions = [];
let selectedSuggestionIndex = -1;

// Hàm hiển thị dropdown với gợi ý
function showSearchDropdown(suggestions) {
    const dropdown = document.getElementById('searchDropdown');
    dropdown.innerHTML = '';

    if (suggestions.length === 0) {
        dropdown.style.display = 'none';
        return;
    }

    suggestions.forEach((suggestion, index) => {
        const item = document.createElement('div');
        item.className = 'search-dropdown-item';
        item.textContent = suggestion.name;
        item.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            selectSuggestion(suggestion);
        });
        dropdown.appendChild(item);
    });

    dropdown.style.display = 'block';
    selectedSuggestionIndex = -1;
}

// Hàm ẩn dropdown
function hideSearchDropdown() {
    const dropdown = document.getElementById('searchDropdown');
    dropdown.style.display = 'none';
    selectedSuggestionIndex = -1;
}

// Hàm chọn gợi ý từ dropdown
function selectSuggestion(suggestion) {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = suggestion.name;
    hideSearchDropdown();
    focusSearchResult(suggestion);

    // Cập nhật thông tin
    let info = `Đã chọn: <strong>${suggestion.name}</strong><br>`;
    const props = suggestion.feature.properties;
    for (let key in props) {
        if (props.hasOwnProperty(key)) {
            info += `<strong>${key}:</strong> ${props[key]}<br>`;
        }
    }
    updateInfo(info);
}

// Hàm xử lý input trong ô tìm kiếm
function handleSearchInput() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();

    if (query.length < 1) {
        hideSearchDropdown();
        return;
    }

    // Tìm kiếm gợi ý
    const suggestions = searchFeatures(query).slice(0, 10); // Giới hạn 10 gợi ý
    showSearchDropdown(suggestions);
}

// Hàm xử lý phím mũi tên và enter trong dropdown
function handleSearchKeydown(e) {
    const dropdown = document.getElementById('searchDropdown');
    const items = dropdown.querySelectorAll('.search-dropdown-item');

    if (dropdown.style.display === 'none' || items.length === 0) {
        return;
    }

    // Xóa highlight cũ
    items.forEach(item => item.classList.remove('highlighted'));

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
        e.preventDefault();
        const suggestions = searchFeatures(document.getElementById('searchInput').value.trim());
        if (suggestions[selectedSuggestionIndex]) {
            selectSuggestion(suggestions[selectedSuggestionIndex]);
        }
        return;
    } else if (e.key === 'Escape') {
        hideSearchDropdown();
        return;
    }

    // Highlight item được chọn
    if (selectedSuggestionIndex >= 0) {
        items[selectedSuggestionIndex].classList.add('highlighted');
        items[selectedSuggestionIndex].scrollIntoView({ block: 'nearest' });
    }
}

// Thêm event listeners cho dropdown
document.getElementById('searchInput').addEventListener('keydown', handleSearchKeydown);

// Ẩn dropdown khi click bên ngoài
document.addEventListener('click', function(e) {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(e.target)) {
        hideSearchDropdown();
    }
});

// Export các hàm
window.getFeatureName = getFeatureName;
window.searchFeatures = searchFeatures;
window.highlightFeature = highlightFeature;
window.clearHighlight = clearHighlight;
window.performSearch = performSearch;
window.selectSearchResult = selectSearchResult;
window.clearSearch = clearSearch;
window.showSearchDropdown = showSearchDropdown;
window.hideSearchDropdown = hideSearchDropdown;
window.selectSuggestion = selectSuggestion;
window.handleSearchInput = handleSearchInput;
window.handleSearchKeydown = handleSearchKeydown;