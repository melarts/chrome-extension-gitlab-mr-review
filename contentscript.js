function injectScript(file, node) {
    var th = document.getElementsByTagName(node)[0];
    var s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    th.appendChild(s);
}

window.addEventListener("message", function(event) {
    if (event.source !== window || !event.data.type || 'GON_VAR' !== event.data.type)
        return;

    window.gon = event.data.gon;
    boot();
}, false);


injectScript(chrome.extension.getURL('windowvar.js'), 'body');

function boot() {
    if (typeof window.gon !== 'object') {
        return;
    }

    if (window.gon.api_version !== 'v4') {
        return console.error('Invalid gitlab api version.');
    }

    if (!window.gon.current_username) {
        return console.error('No found username.');
    }

    parseMrLists();
}

function findProjectId() {
    const projectResult = document.querySelectorAll('[data-project-id]')[0];
    return projectResult && projectResult.getAttribute('data-project-id') || null;
}

function findGroupId() {
    const groupResult = document.querySelectorAll('[data-group-id]')[0];
    return groupResult && groupResult.getAttribute('data-group-id') || null;
}

function parseMrLists() {
    var lists = document.getElementsByClassName('mr-list');
    var mrs = [];
    for (var i = 0; i < lists.length; i++) {
        for (var j = 0; j < lists[i].children.length; j++) {
            mrs.push({
                id: parseInt(lists[i].children[j].getAttribute('data-id')),
                iid: parseInt(lists[i].children[j].getElementsByClassName('issuable-reference')[0].innerText.split('!')[1]),
                projectId: findProjectId(),
                groupId: findGroupId(),
            });
        }
    }

    parseMrs(mrs);
}

async function parseMrs(mrs) {
    if (!mrs.length) {
        return
    }

    const type = mrs[0].projectId ? 'projects' : 'groups';
    id = mrs[0].projectId || mrs[0].groupId;
    if (type === 'groups') {
        let total = [];
        let nbResult = 100;
        let i = 1;
        // get the project id of each mr by getting the list of opened mrs in their group id
        while(nbResult >= 100) {
            const res = await getJson(`/api/v4/${type}/${id}/merge_requests?state=opened&view=simple&per_page=500&page=${i}`);
            nbResult = res.length;
            total = [...total, ...res];
            i++;
        }
        mrs = mrs.map(mr => {
            const moreInfos = total.find(re => re.id === mr.id)
            return { ...mr, projectId: moreInfos.project_id };
        })
    }

    // check which of the opened mr the connected gitlab used as approved with a thumbsup
    await getJson(`/api/v4/${type}/${id}/merge_requests?my_reaction_emoji=thumbsup&state=opened&view=simple`).then((validatedOpenedMrs) => {
        mrs = mrs.map(mr => {
            const isValidated = validatedOpenedMrs.some(m => m.id === mr.id)
            return { ...mr, isValidated };
        })
    })

    mrs.forEach(mr => {
        const mrIid = mr.iid;
        const mrId = mr.id;
        const approvedCacheKey = window.gon.current_username + '_approved_' + mrIid;
        const commentedCacheKey = window.gon.current_username + '_commented_' + mrIid;
        const baseProjectUrl = '/api/v4/projects/' + mr.projectId + '/merge_requests';

        chrome.storage.local.get([approvedCacheKey, commentedCacheKey], function (cachedValues) {
            if (mr.isValidated) {
                identifyMr(mrId, 'approved');
                setLocalCacheValue(approvedCacheKey, true);
            }
                getJson(baseProjectUrl + '/' + mrIid + '/notes').then(function (res) {
                    const userHasCommented = res.filter(function (comment) {
                        return comment.author.username === window.gon.current_username;
                    }).length > 0;

                    if (userHasCommented) {
                        identifyMr(mrId, 'commented');
                        setLocalCacheValue(commentedCacheKey, true);
                    }
                });
        
        });
    })
}

function identifyMr(id, status) {
    const el = document.getElementById('merge_request_' + id);
    if ('approved' === status && el.getElementsByClassName('issuable-upvotes').length) {
        el.getElementsByClassName('issuable-upvotes')[0].style.color = 'red';
    } else if ('commented' === status && el.getElementsByClassName('issuable-comments').length) {
        el.getElementsByClassName('issuable-comments')[0].getElementsByTagName('a')[0].style.color = 'red';
    }
}

function getJson(url) {
    return fetch(window.gon.gitlab_url.replace('http://','https://') + url, {
        method: 'GET',
        credentials: 'include'
    }).then(function(res) {
        return res.json();
    });
}

function setLocalCacheValue(key, value) {
    var cache = {};
    cache[key] = value;
    chrome.storage.local.set(cache)
}
