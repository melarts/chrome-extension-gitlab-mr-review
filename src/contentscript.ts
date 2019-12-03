interface ParsedMR {
    id: number;
    iid: number;
    authorId: number;
    projectId?: string;
    validated?: boolean;
}

interface HighlightableMR extends ParsedMR {
    projectId: string;
}

interface MRDto {
    id: number;
    iid: number;
    project_id: number;
    title: string;
    description: string;
    state: string;
    created_at: Date;
    updated_at: Date;
    web_url: string;
}

interface MRNoteDto {
    id: number;
    type?: any;
    body: string;
    attachment?: any;
    author: {
        id: number;
        name: string;
        username: string;
        state: string;
        avatar_url: string;
        web_url: string;
    };
    created_at: string;
    updated_at: string;
    system: boolean;
    noteable_id: number;
    noteable_type: string;
    resolvable: boolean;
    resolved?: boolean;
    noteable_iid: number;
}

type mrUrlFactory = () => (pageIndex: number) => string;

function htmlCollectionToArray<T extends Element>(collection: HTMLCollectionOf<T> | NodeListOf<T>): Array<T> {
    return Array.prototype.slice.call(collection, 0);
}

function stringToNumber(str?: string | null): number {
    return typeof str === 'string' ? parseInt(str, 10) : NaN;
}

function getElementBySelector<T extends Element>(selector: string, elt?: Element): T | undefined {
    const node = elt || document;
    const [result] = htmlCollectionToArray<T>(node.querySelectorAll(selector));
    return result;
}

function findDataAttribute(attr: string, elt?: Element): string | null {
    const result = getElementBySelector(`[${attr}]`, elt);
    return result && result.getAttribute(attr) || null;
}

function identifyYourMrs(id: number, userId: number) {
    if (window.gon.current_user_id !== userId) {
        return;
    }

    // TODO see if it cannot be done in one selector
    const issuableUpvote = getElementBySelector(`#merge_request_${id} .issuable-upvotes`);
    const titleText = getElementBySelector<HTMLElement>(`#merge_request_${id} .merge-request-title-text a`);;

    if (!issuableUpvote || !titleText) {
        return;
    }

    titleText.style.color = 'green';
}

function identifyMr(id: number, status: 'approved' | 'commented') {
    let el: HTMLElement | undefined;

    switch (status) {
        case 'approved':
            el = getElementBySelector(`#merge_request_${id} .issuable-upvotes`);
            break;
        case 'commented':
            el = getElementBySelector(`#merge_request_${id} .issuable-comments a`);
            break;
    }

    if (!el) {
        return;
    }

    el.style.color = 'red';
}

function setLocalCacheValue(key: string, value: boolean) {
    var cache: { [key: string]: boolean } = {};
    cache[key] = value;
    chrome.storage.local.set(cache)
}

async function httpGet(url: string): Promise<Response> {
    const res = await fetch(`${window.gon.gitlab_url.replace('http://', 'https://')}${url}`, {
        method: 'GET',
        credentials: 'include'
    });

    if (!res.ok) {
        throw new Error(`Request url ${url} : got ${res.status}`);
    }

    return res;
}

async function getJson<T>(url: string): Promise<T> {
    return (await httpGet(url)).json();
}

function isHighlightable(mr: ParsedMR): mr is HighlightableMR {
    return !!mr.projectId;
}

function userMrsUrlFactory(params?: { type: string, id: string }) {
    return (pageIndex: number) => params
        ? `/api/v4/${params.type}/${params.id}/merge_requests?state=opened&view=simple&per_page=500&page=${pageIndex}`
        : `/api/v4/merge_requests?state=opened&view=simple&per_page=500&scope=all&page=${pageIndex}`
}

function userValidatedMrsUrlFactory(params?: { type: string, id: string }) {
    return (pageIndex: number) => params
        ? `/api/v4/${params.type}/${params.id}/merge_requests?my_reaction_emoji=thumbsup&state=opened&view=simple&per_page=500&page=${pageIndex}`
        : `/api/v4/merge_requests?my_reaction_emoji=thumbsup&state=opened&view=simple&per_page=500&scope=all&page=${pageIndex}`
}

function parseMrsList(): ParsedMR[] {
    const lists = htmlCollectionToArray(document.getElementsByClassName('mr-list'));
    const mrs: ParsedMR[] = [];
    for (const mr of lists) {
        const children = htmlCollectionToArray(mr.children);
        for (const child of children) {
            const issuableReference = getElementBySelector<HTMLElement>('.issuable-reference', child);
            const issuableAuthored = getElementBySelector<HTMLElement>('.issuable-authored', child);
            mrs.push({
                id: stringToNumber(child.getAttribute('data-id')),
                iid: (issuableReference && stringToNumber(issuableReference.innerText.split('!')[1])) || NaN,
                authorId: (issuableAuthored && stringToNumber(findDataAttribute('data-user-id', issuableAuthored))) || NaN,
            });
        }
    }

    return mrs;
}

async function fetchMrs(getUrl: ReturnType<mrUrlFactory>) {
    let mrs: MRDto[] = [];
    let nbResult = 100;
    let i = 1;
    while (nbResult >= 100) {
        try {
            const res = await getJson<MRDto[]>(getUrl(i));
            nbResult = res.length;
            mrs.push(...res);
            i++;
        } catch (e) {
            console.error(e)
            break;
        }
    }
    return mrs;
}

async function fetchUserMrsDetail() {
    const projectId = findDataAttribute('data-project-id');
    const groupId = findDataAttribute('data-group-id');

    const params = projectId
        ? { type: 'projects', id: projectId }
        : groupId
            ? { type: 'groups', id: groupId }
            : undefined;

    return Promise.all([
        fetchMrs(userMrsUrlFactory(params)),
        fetchMrs(userValidatedMrsUrlFactory(params)),
    ]);
}

async function highlightMr({ iid, id, authorId, validated, projectId }: HighlightableMR) {
    const username = window.gon.current_username;
    const approvedCacheKey = `${username}_approved_${iid}`;
    const commentedCacheKey = `${username}_commented_${iid}`;
    const baseProjectUrl = `/api/v4/projects/${projectId}/merge_requests`;

    chrome.storage.local.get([approvedCacheKey, commentedCacheKey], async () => {
        identifyYourMrs(id, authorId);

        if (validated) {
            identifyMr(id, 'approved');
            setLocalCacheValue(approvedCacheKey, true);
        }

        const mrNotes = (await getJson<MRNoteDto[]>(`${baseProjectUrl}/${iid}/notes`))
            .filter((note) => !!note.resolvable && !note.resolved);

        const userHasCommented = !!mrNotes
            .find((note) => note.author.username === username);

        if (userHasCommented) {
            identifyMr(id, 'commented');
            setLocalCacheValue(commentedCacheKey, true);
        }
    });
}

async function highlightMrs() {
    const [[userMrs, userValidatedMrs], mrsList] = await Promise.all([fetchUserMrsDetail(), parseMrsList()]);

    const highlightableMrs: HighlightableMR[] = mrsList
        .map((mr): ParsedMR => {
            const userMr = userMrs.find(re => re.id === mr.id);
            const userValidatedMr = userValidatedMrs.find(re => re.id === mr.id);
            return {
                ...mr,
                projectId: (userMr && userMr.project_id.toString()) || undefined,
                validated: !!userValidatedMr,
            };
        })
        .filter(isHighlightable);

    highlightableMrs.forEach(highlightMr);
}

async function boot() {
    if (typeof window.gon !== 'object') {
        return;
    }

    if (window.gon.api_version !== 'v4') {
        return console.error('Invalid gitlab api version.');
    }

    if (!window.gon.current_username) {
        return console.error('No found username.');
    }

    highlightMrs();
}

window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data.type || 'GON_VAR' !== event.data.type)
        return;

    window.gon = event.data.gon;
    boot();
}, false);

function injectScript(file: string, node: string) {
    const th = document.getElementsByTagName(node)[0];
    const s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    th.appendChild(s);
}

injectScript(chrome.extension.getURL('windowvar.js'), 'body');
