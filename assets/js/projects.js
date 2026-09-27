(() => {
    'use strict';

    const dialog = document.getElementById('project-dialog');
    const data = document.getElementById('project-data');
    if (!dialog || !data || typeof dialog.showModal !== 'function') return;

    const image = document.getElementById('project-dialog-image');
    const title = document.getElementById('project-dialog-title');
    const category = document.getElementById('project-dialog-category');
    const description = document.getElementById('project-dialog-description');
    const counter = document.getElementById('project-dialog-counter');
    const thumbnails = document.getElementById('project-dialog-thumbnails');
    const source = document.getElementById('project-dialog-source');
    const estimate = document.getElementById('project-dialog-estimate');
    const previous = dialog.querySelector('[data-project-prev]');
    const next = dialog.querySelector('[data-project-next]');
    const close = dialog.querySelector('[data-project-close]');
    if (![image, title, category, description, counter, thumbnails, source, estimate, previous, next, close].every(Boolean)) return;

    let records;
    try {
        records = JSON.parse(data.textContent);
    } catch {
        return;
    }
    if (!Array.isArray(records)) return;

    // Invalid records retain their original Instagram link as a useful fallback.
    const validText = (value) => typeof value === 'string' && value.trim().length > 0;
    const validSource = (value) => {
        if (!validText(value)) return false;
        try {
            const url = new URL(value);
            return url.origin === 'https://www.instagram.com'
                && !url.username && !url.password
                && url.pathname.startsWith('/arthome.service/');
        } catch {
            return false;
        }
    };
    const validImage = (value) => {
        // Gallery photos are local raster assets, never executable or remote URLs.
        return validText(value)
            && /^assets\/img\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:jpe?g|png|webp|avif)$/i.test(value);
    };
    const projects = new Map(records.filter((project) => {
        if (!project || ![project.id, project.title, project.category, project.description, project.source].every(validText)) return false;
        if (!validSource(project.source)) return false;
        if (!Array.isArray(project.images) || !project.images.length) return false;
        return project.images.every((photo) => photo && validImage(photo.src) && validText(photo.alt));
    }).map((project) => [project.id, project]));
    if (!projects.size) return;

    let currentProject = null;
    let currentIndex = 0;
    let opener = null;
    let pointerStartedOutside = false;

    const outsideDialog = (event) => {
        const bounds = dialog.getBoundingClientRect();
        return event.clientX < bounds.left || event.clientX > bounds.right
            || event.clientY < bounds.top || event.clientY > bounds.bottom;
    };

    function showPhoto(index) {
        if (!currentProject) return;
        const total = currentProject.images.length;
        currentIndex = (index + total) % total;
        const photo = currentProject.images[currentIndex];
        image.alt = photo.alt;
        for (const dimension of ['width', 'height']) {
            if (Number.isInteger(photo[dimension]) && photo[dimension] > 0) image.setAttribute(dimension, String(photo[dimension]));
            else image.removeAttribute(dimension);
        }
        image.src = photo.src;
        counter.textContent = `${currentIndex + 1} / ${total}`;
        counter.setAttribute('aria-label', `Photo ${currentIndex + 1} of ${total}`);
        [...thumbnails.children].forEach((button, position) => {
            button.setAttribute('aria-pressed', String(position === currentIndex));
        });
    }

    function populate(project) {
        currentProject = project;
        title.textContent = project.title;
        category.textContent = project.category;
        description.textContent = project.description;
        source.href = project.source;
        const message = validText(project.estimateMessage)
            ? project.estimateMessage
            : `Hello! I'd like a free estimate for a project like "${project.title}".`;
        estimate.href = `https://wa.me/15082805337?text=${encodeURIComponent(message)}`;

        const fragment = document.createDocumentFragment();
        project.images.forEach((photo, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'project-dialog__thumb';
            button.setAttribute('aria-label', `View photo ${index + 1} of ${project.images.length}`);
            button.setAttribute('aria-pressed', 'false');
            const thumbnail = document.createElement('img');
            thumbnail.src = photo.src;
            thumbnail.alt = '';
            thumbnail.loading = 'lazy';
            thumbnail.decoding = 'async';
            button.append(thumbnail);
            button.addEventListener('click', () => showPhoto(index));
            fragment.append(button);
        });
        thumbnails.replaceChildren(fragment);
        const singlePhoto = project.images.length === 1;
        previous.hidden = singlePhoto;
        next.hidden = singlePhoto;
        thumbnails.hidden = singlePhoto;
        counter.hidden = singlePhoto;
        showPhoto(0);
    }

    document.querySelectorAll('[data-project-open]').forEach((link) => {
        if (!projects.has(link.dataset.projectOpen)) return;
        link.setAttribute('aria-haspopup', 'dialog');
        link.setAttribute('aria-controls', 'project-dialog');
        link.addEventListener('click', (event) => {
            if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            const project = projects.get(link.dataset.projectOpen);
            if (!project || dialog.open) return;
            try {
                populate(project);
                dialog.showModal();
                dialog.scrollTop = 0;
            } catch {
                return;
            }
            event.preventDefault();
            opener = link;
            pointerStartedOutside = false;
            document.body.classList.add('project-open');
            close.focus({ preventScroll: true });
        });
    });

    close.addEventListener('click', () => dialog.close());
    previous.addEventListener('click', () => showPhoto(currentIndex - 1));
    next.addEventListener('click', () => showPhoto(currentIndex + 1));

    dialog.addEventListener('pointerdown', (event) => {
        pointerStartedOutside = event.target === dialog && outsideDialog(event);
    });
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog && pointerStartedOutside && outsideDialog(event)) dialog.close();
        pointerStartedOutside = false;
    });
    dialog.addEventListener('keydown', (event) => {
        if (!dialog.open || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
        if (event.target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
        if (!currentProject || currentProject.images.length < 2) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            showPhoto(currentIndex + (event.key === 'ArrowLeft' ? -1 : 1));
        }
    });
    // Native dialog handles Escape and keeps Tab navigation inside the modal.
    dialog.addEventListener('close', () => {
        if (dialog.open) return;
        document.body.classList.remove('project-open');
        if (opener?.isConnected) opener.focus({ preventScroll: true });
        opener = null;
        currentProject = null;
        pointerStartedOutside = false;
    });
})();
