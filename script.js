// 初期化時のデフォルト項目リスト
let optionsList = [
    { id: 'chikoku', label: '遅刻', defaultVal: 20, isCustom: false },
    { id: 'toshiue', label: '年上', defaultVal: 50, isCustom: false },
    { id: 'birthday', label: '誕生日', defaultVal: -70, isCustom: false },
    { id: 'kanji', label: '企画者', defaultVal: -10, isCustom: false },
    { id: 'osake', label: '大酒飲み', defaultVal: 20, isCustom: false },
    { id: 'oogui', label: '大食い', defaultVal: 30, isCustom: false },
    { id: 'softdrink', label: 'ソフドリ', defaultVal: -20, isCustom: false }
];

let memberCount = 0;
let membersData = [];

document.addEventListener('DOMContentLoaded', () => {
    // 初期メンバー
    addMember('メンバーA');
    addMember('メンバーB');
    
    // イベント
    document.getElementById('go-to-result-btn').addEventListener('click', switchToResultView);
    document.getElementById('back-to-input-btn').addEventListener('click', switchToInputView);
    document.getElementById('add-member-btn').addEventListener('click', () => addMember());
    document.getElementById('add-custom-opt-btn').addEventListener('click', createCustomOption);
    document.getElementById('reset-all-btn').addEventListener('click', resetAll);
});

function switchToResultView() {
    calculateWarikan();
    document.getElementById('input-view').classList.remove('active');
    document.getElementById('result-view').classList.add('active');
    window.scrollTo(0, 0);
}

function switchToInputView() {
    document.getElementById('result-view').classList.remove('active');
    document.getElementById('input-view').classList.add('active');
    window.scrollTo(0, 0);
}

function addMember(defaultName = '') {
    memberCount++;
    const id = memberCount;
    const name = defaultName || `メンバー${String.fromCharCode(64 + id)}`;
    
    membersData.push({ id: id, defaultName: name });

    const container = document.getElementById('members-container');
    const card = document.createElement('div');
    card.className = 'card member-card';
    card.id = `member-card-${id}`;

    card.innerHTML = `
        <div class="member-header">
            <input type="text" class="member-name-input" id="member-name-${id}" value="${name}" placeholder="名前を入力">
            <button class="btn btn-danger" onclick="removeMember(${id})">削除</button>
        </div>
        <div class="options-grid" id="options-grid-${id}"></div>
    `;
    container.appendChild(card);
    renderOptionsForMember(id);

    document.getElementById(`member-name-${id}`).addEventListener('input', calculateWarikan);
}

// メンバーごとに選択肢を描画（新しく追加・削除された時にもここが呼ばれる）
function renderOptionsForMember(memberId) {
    const grid = document.getElementById(`options-grid-${memberId}`);
    grid.innerHTML = '';

    optionsList.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'option-item';
        
        // 基本の構造（チェックボックス ＋ ラベル ＋ ％入力）
        let html = `
            <input type="checkbox" id="${opt.id}-${memberId}">
            <label for="${opt.id}-${memberId}">${opt.label}</label>
            <div class="percent-input-wrap">
                <input type="number" id="${opt.id}-val-${memberId}" value="${opt.defaultVal}">
                <span>%</span>
            </div>
        `;
        
        // 自作したカスタム項目の場合のみ、右端に削除ボタン（×）を出現させる
        if (opt.isCustom) {
            html += `<button class="btn-opt-delete" onclick="deleteCustomOption('${opt.id}')" title="この理由を削除">×</button>`;
        }
        
        item.innerHTML = html;
        grid.appendChild(item);
    });
}

// 新しい理由（カスタム項目）の追加
function createCustomOption() {
    const labelInput = document.getElementById('new-opt-label');
    const valInput = document.getElementById('new-opt-val');
    const label = labelInput.value.trim();
    const val = parseInt(valInput.value) || 0;

    if (!label) { alert('理由を入力してください！'); return; }

    const uniqueId = 'custom_' + Date.now();
    // isCustom: true をつけて追加するのがポイント
    optionsList.push({ id: uniqueId, label: label, defaultVal: val, isCustom: true });

    // 全メンバーのカードを一斉に再更新
    refreshAllMemberOptions();

    labelInput.value = '';
    valInput.value = '0';
}

// 【新機能】間違えて追加したカスタム理由を完全に消し去る関数
function deleteCustomOption(optionId) {
    // 該当のオプションをリストから排除
    optionsList = optionsList.filter(opt => opt.id !== optionId);
    
    // 全員のカードを再描画して、画面から消す
    refreshAllMemberOptions();
}

// 全メンバーのオプションエリアを最新状態に同期するヘルパー
function refreshAllMemberOptions() {
    membersData.forEach(m => {
        if (document.getElementById(`member-card-${m.id}`)) {
            renderOptionsForMember(m.id);
        }
    });
}

function removeMember(id) {
    const card = document.getElementById(`member-card-${id}`);
    if (card) {
        card.remove();
        membersData = membersData.filter(m => m.id !== id);
    }
}

function resetAll() {
    document.getElementById('total-amount').value = '';
    membersData.forEach(m => {
        optionsList.forEach(opt => {
            const checkbox = document.getElementById(`${opt.id}-${m.id}`);
            const input = document.getElementById(`${opt.id}-val-${m.id}`);
            if (checkbox) checkbox.checked = false;
            if (input) input.value = opt.defaultVal;
        });
    });
}

// 割り勘計算ロジック
function calculateWarikan() {
    const totalAmount = parseFloat(document.getElementById('total-amount').value) || 0;
    const resultsList = document.getElementById('results-list');
    
    document.getElementById('result-total-money').innerText = `${totalAmount.toLocaleString()} 円`;
    resultsList.innerHTML = '';

    const activeCards = membersData.filter(m => document.getElementById(`member-card-${m.id}`));

    if (activeCards.length === 0 || totalAmount === 0) {
        resultsList.innerHTML = '<div class="result-item">金額とメンバーを設定してください</div>';
        return;
    }

    let memberWeights = [];
    let totalWeight = 0;

    activeCards.forEach(m => {
        const nameInput = document.getElementById(`member-name-${m.id}`);
        const name = nameInput ? nameInput.value : '名無し';
        let weight = 1.0;

        optionsList.forEach(opt => {
            const checkbox = document.getElementById(`${opt.id}-${m.id}`);
            const inputVal = parseFloat(document.getElementById(`${opt.id}-val-${m.id}`).value) || 0;
            
            if (checkbox && checkbox.checked) {
                weight += (inputVal / 100);
            }
        });

        if (weight < 0.1) weight = 0.1;

        memberWeights.push({ name: name, weight: weight, amount: 0 });
        totalWeight += weight;
    });

    let calculatedTotal = 0;
    memberWeights.forEach(m => {
        let share = totalAmount * (m.weight / totalWeight);
        m.amount = Math.round(share);
        calculatedTotal += m.amount;
    });

    const diff = totalAmount - calculatedTotal;
    if (memberWeights.length > 0 && diff !== 0) {
        memberWeights[0].amount += diff;
    }

    memberWeights.forEach(m => {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `
            <span class="result-name">${m.name}</span>
            <span class="result-money">${m.amount.toLocaleString()} 円</span>
        `;
        resultsList.appendChild(item);
    });
}