LoadData();
LoadComments();
async function LoadData() {
    //async await 
    //HTTP Request GET, GET1, PUT, POST, DELETE
    try {
        let res = await fetch('http://localhost:3000/posts');
        let posts = await res.json();
        let body = document.getElementById('post-body')
        body.innerHTML = "";
        for (const post of posts) {
            body.innerHTML += convertDataToHTML(post);
        }
    } catch (error) {
        console.log(error);
    }

}
function convertDataToHTML(post) {
    let style = post.isDeleted
        ? "style='text-decoration:line-through;color:gray'"
        : "";

    let btn = post.isDeleted
        ? "Đã xóa"
        : `
            <input type='submit' value='delete' onclick='Delete("${post.id}")'/>
            
          `;

    return `
    <tr ${style}>
        <td>${post.id}</td>
        <td>${post.title}</td>
        <td>${post.views}</td>
        <td>${btn}</td>
    </tr>`;
}


async function saveData() {
    let title = document.getElementById("title_txt").value;
    let view = document.getElementById("views_txt").value;
    let res = await fetch('http://localhost:3000/posts');
    let posts = await res.json();

    let maxId = posts.length
        ? Math.max(...posts.map(p => Number(p.id)))
        : 0;

    let newPost = {
        id: String(maxId + 1),   
        title: title,
        views: view,
        isDeleted: false
    };

    let resPOST = await fetch('http://localhost:3000/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPost)
    });

    if (resPOST.ok) {
        console.log("Thêm thành công");
        LoadData();
    }

    return false;
}

async function Delete(id) {
    let res = await fetch('http://localhost:3000/posts/' + id, {
        method: "PATCH",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            isDeleted: true
        })
    });

    if (res.ok) {
        console.log("xóa mềm thành công");
        LoadData();
    }
}
// 
async function CommentLoadData(postId) {
    let res = await fetch(
        'http://localhost:3000/comments?postId=' + postId
    );
    let comments = await res.json();

    let body = document.getElementById('comment-body');
    body.innerHTML = "";

    for (const c of comments) {
        body.innerHTML += convertCommentToHTML(c);
    }
}

function convertCommentToHTML(comment) {
    let style = comment.isDeleted
        ? "style='text-decoration:line-through;color:gray'"
        : "";

    let btn = comment.isDeleted
        ? "Đã xóa"
        : `<input type="submit" value="delete" onclick="deleteComment('${comment.id}')">`;

    return `
        <tr ${style}>
            <td>${comment.id}</td>
            <td>${comment.text}</td>
            <td>${comment.postId}</td>
            <td>${btn}</td>
        </tr>
    `;
}

async function LoadComments() {
    try {
        let res = await fetch('http://localhost:3000/comments');
        let comments = await res.json();

        let body = document.getElementById('comment-body');
        body.innerHTML = "";

        for (const c of comments) {
            body.innerHTML += convertCommentToHTML(c);
        }
    } catch (error) {
        console.log(error);
    }
}


async function addComment(postId, text) {
    let res = await fetch('http://localhost:3000/comments');
    let comments = await res.json();
    let maxId = comments.length
        ? Math.max(...comments.map(c => Number(c.id)))
        : 0;
    await fetch('http://localhost:3000/comments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: String(maxId + 1),
            postId: postId,
            text: text,
            isDeleted: false
        })
    });
}
async function deleteComment(id) {
    await fetch('http://localhost:3000/comments/' + id, {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDeleted: true })
    });
    LoadComments();
}

// ------------------ Products admin table (getAll) ------------------
async function getAllProducts() {
    try {
        let res = await fetch('http://localhost:3000/products');
        if (!res.ok) {
            let bodyEl = document.getElementById('product-body');
            if (bodyEl) bodyEl.innerHTML = `<tr><td colspan="8">Products endpoint not found (HTTP ${res.status}).</td></tr>`;
            return;
        }

        let products = await res.json();
        // cache products for client-side filtering
        window._productsCache = products || [];
        // initialize UI state
        window._pageSize = Number(document.getElementById('page-size')?.value) || 10;
        window._currentPage = 1;
        window._sortOption = document.getElementById('sort-select')?.value || '';
        window._lastSearch = document.getElementById('search-title')?.value || '';
        updateView();
    } catch (error) {
        console.error(error);
        let bodyEl = document.getElementById('product-body');
        if (bodyEl) bodyEl.innerHTML = `<tr><td colspan="8">Error loading products.</td></tr>`;
    }
}

function renderProducts(products) {
    const body = document.getElementById('product-body');
    if (!body) return;
    body.innerHTML = '';
    if (!products || products.length === 0) {
        body.innerHTML = `<tr><td colspan="8">No products found.</td></tr>`;
        updateResultCount(0,0,0);
        renderPagination(0,1);
        return;
    }
    body.innerHTML = products.map(convertProductToHTML).join('');
    const totalFiltered = window._totalFilteredCount ?? products.length;
    const start = (window._currentPage - 1) * window._pageSize + 1;
    const end = start + products.length - 1;
    updateResultCount(start,end,totalFiltered);
}

function updateResultCount(start,end,total){
    const el = document.getElementById('result-count');
    if (!el) return;
    if (arguments.length === 1) el.textContent = String(arguments[0]);
    else el.textContent = `${start}-${end} of ${total}`;
}

function convertProductToHTML(p) {
    let category = p.category && (p.category.name || p.category) ? (p.category.name || p.category) : '';
    let img = '';
    try {
        if (p.images && p.images.length) {
            const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100"><rect width="100%" height="100%" fill="#f5f5f5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-size="12">No image</text></svg>`);
            const src = p.images[0] || placeholder;
            img = `<img src="${src}" class="thumb" alt="${(p.title||'').replace(/"/g,'')}" onerror="this.onerror=null;this.src='${placeholder}'">`;
        }
    } catch (e) { img = ''; }

    return `
    <tr>
        <td>${p.id ?? ''}</td>
        <td>${p.title ?? ''}</td>
        <td>${p.price ?? ''}</td>
        <td>${category}</td>
        <td>${img}</td>
        <td>${p.creationAt ?? ''}</td>
        <td>${p.updatedAt ?? ''}</td>
        <td><button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')">Delete</button></td>
    </tr>`;
}

async function deleteProduct(id) {
    try {
        await fetch('http://localhost:3000/products/' + id, {
            method: "PATCH",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isDeleted: true })
        });
    } catch (e) {
        console.error(e);
    }
    // refresh cache and UI
    await getAllProducts();
}

// live search + sorting + pagination handlers
function onSearchChange(query) {
    window._lastSearch = (query || '').trim();
    window._currentPage = 1;
    updateView();
}

function onSortChange(sortVal){
    window._sortOption = sortVal || '';
    window._currentPage = 1;
    updateView();
}

function onPageSizeChange(size){
    window._pageSize = Number(size) || 10;
    window._currentPage = 1;
    updateView();
}

function updateView(){
    if (!window._productsCache) return;
    const q = (window._lastSearch || '').toLowerCase();
    let filtered = window._productsCache.filter(p => (p.title || '').toLowerCase().includes(q));
    window._totalFilteredCount = filtered.length;
    // sort
    if (window._sortOption) filtered = applySort(filtered, window._sortOption);
    // pagination
    const pageSize = window._pageSize || 10;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (!window._currentPage || window._currentPage < 1) window._currentPage = 1;
    if (window._currentPage > totalPages) window._currentPage = totalPages;
    const start = (window._currentPage - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);
    renderProducts(pageItems);
    renderPagination(totalPages, window._currentPage);
}

function applySort(arr, opt){
    const copy = [...arr];
    switch(opt){
        case 'price-asc': copy.sort((a,b)=>Number(a.price||0)-Number(b.price||0)); break;
        case 'price-desc': copy.sort((a,b)=>Number(b.price||0)-Number(a.price||0)); break;
        case 'name-asc': copy.sort((a,b)=>String(a.title||'').localeCompare(String(b.title||''))); break;
        case 'name-desc': copy.sort((a,b)=>String(b.title||'').localeCompare(String(a.title||''))); break;
    }
    return copy;
}

function renderPagination(totalPages, currentPage){
    const el = document.getElementById('pagination');
    if (!el) return;
    el.innerHTML = '';
    const createLi = (label, disabled, active, onClick) => {
        const li = document.createElement('li');
        li.className = 'page-item' + (disabled? ' disabled':'') + (active? ' active':'');
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.textContent = label;
        a.onclick = (e)=>{e.preventDefault(); if(!disabled) onClick();};
        li.appendChild(a);
        return li;
    };
    // prev
    el.appendChild(createLi('Prev', currentPage<=1, false, ()=>{ window._currentPage = Math.max(1, window._currentPage-1); updateView(); }));
    const maxButtons = 7;
    let start = Math.max(1, currentPage - Math.floor(maxButtons/2));
    let end = Math.min(totalPages, start + maxButtons -1);
    if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1);
    for(let i=start;i<=end;i++){
        el.appendChild(createLi(String(i), false, i===currentPage, ()=>{ window._currentPage = i; updateView(); }));
    }
    // next
    el.appendChild(createLi('Next', currentPage>=totalPages, false, ()=>{ window._currentPage = Math.min(totalPages, window._currentPage+1); updateView(); }));
}
