/**
 * GraphRenderer - SVG Git DAG Commit Tree Visualizer
 * Inspired by LearnGitBranching with animated Bezier curves, interactive nodes,
 * branch pills, tag indicators, and worktree labels.
 */

class GraphRenderer {
  constructor(svgContainerElement) {
    this.container = svgContainerElement;
    this.nodeRadius = 18;
    this.rowHeight = 65;
    this.colWidth = 90;
    this.branchColors = [
      '#58a6ff', // blue (main)
      '#bc8cff', // purple (feature)
      '#3fb950', // green
      '#d29922', // yellow/orange
      '#f85149', // red
      '#56d4dd'  // cyan
    ];
  }

  render(git, onNodeClick = null) {
    if (!this.container) return;
    this.container.innerHTML = '';

    const commits = Array.from(git.commits.values());
    if (commits.length === 0) {
      this.container.innerHTML = `
        <text x="50%" y="50%" text-anchor="middle" fill="#8b949e" font-size="14" font-family="'Fira Code', monospace">
          (尚未建立任何 Commit，請執行 git commit 建立第一個節點)
        </text>
      `;
      return;
    }

    // 1. Assign Lanes & Topology Layout
    const layout = this.calculateLayout(commits, git);

    // 2. Compute SVG dimensions
    const width = Math.max(layout.maxCol * this.colWidth + 240, 500);
    const height = Math.max(layout.maxRow * this.rowHeight + 140, 350);
    this.container.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.container.setAttribute('width', '100%');
    this.container.setAttribute('height', '100%');

    // 3. Definitions (arrow markers, shadows, filters)
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.5"/>
      </filter>
      <marker id="arrow" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#484f58" />
      </marker>
    `;
    this.container.appendChild(defs);

    // Group for links
    const linksGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    linksGroup.setAttribute('class', 'git-links');
    this.container.appendChild(linksGroup);

    // 4. Draw Links (Bezier curves from child to parent)
    for (const [id, pos] of layout.positions.entries()) {
      const commit = git.commits.get(id);
      if (!commit || !commit.parents) continue;

      for (const parentId of commit.parents) {
        const parentPos = layout.positions.get(parentId);
        if (!parentPos) continue;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = this.calculateCurve(pos.x, pos.y, parentPos.x, parentPos.y);
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#30363d');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('stroke-linecap', 'round');
        linksGroup.appendChild(path);
      }
    }

    // Group for nodes
    const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodesGroup.setAttribute('class', 'git-nodes');
    this.container.appendChild(nodesGroup);

    // Group for badges (Branches, Tags, HEAD)
    const badgesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    badgesGroup.setAttribute('class', 'git-badges');
    this.container.appendChild(badgesGroup);

    const headCommitId = git.getHeadCommitId();

    // 5. Draw Commit Nodes
    for (const [id, pos] of layout.positions.entries()) {
      const commit = git.commits.get(id);
      const isHead = id === headCommitId;
      const color = this.branchColors[pos.lane % this.branchColors.length];

      const nodeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      nodeG.setAttribute('class', 'commit-node');
      nodeG.setAttribute('cursor', 'pointer');
      nodeG.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);

      // Outer glow for HEAD
      if (isHead) {
        const glowCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        glowCircle.setAttribute('r', this.nodeRadius + 6);
        glowCircle.setAttribute('fill', 'none');
        glowCircle.setAttribute('stroke', '#58a6ff');
        glowCircle.setAttribute('stroke-width', '2');
        glowCircle.setAttribute('stroke-dasharray', '3 3');
        glowCircle.setAttribute('filter', 'url(#glow)');
        nodeG.appendChild(glowCircle);
      }

      // Circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', this.nodeRadius);
      circle.setAttribute('fill', '#161b22');
      circle.setAttribute('stroke', isHead ? '#ffffff' : color);
      circle.setAttribute('stroke-width', isHead ? '3.5' : '2.5');
      circle.setAttribute('filter', 'url(#shadow)');
      nodeG.appendChild(circle);

      // Label (Short Hash)
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dy', '4');
      text.setAttribute('fill', '#f0f6fc');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', '600');
      text.setAttribute('font-family', "'Fira Code', monospace");
      text.textContent = id.substring(0, 4);
      nodeG.appendChild(text);

      // Tooltip title
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${id} - ${commit.message}\nAuthor: ${commit.author}`;
      nodeG.appendChild(title);

      // Click event
      if (onNodeClick) {
        nodeG.addEventListener('click', () => onNodeClick(commit));
      }

      nodesGroup.appendChild(nodeG);
    }

    // 6. Draw Branch, Tag & HEAD Badges
    for (const [id, pos] of layout.positions.entries()) {
      const badges = [];

      // HEAD badge
      if (id === headCommitId) {
        const isDetached = git.HEAD.type === 'detached';
        badges.push({
          label: isDetached ? 'HEAD (detached)' : 'HEAD',
          color: '#f0f6fc',
          bg: '#21262d',
          border: '#58a6ff',
          isHead: true
        });
      }

      // Local Branches
      for (const [branchName, commitId] of git.branches.entries()) {
        if (commitId === id) {
          const isCurrent = git.getCurrentBranch() === branchName;
          badges.push({
            label: isCurrent ? `${branchName} *` : branchName,
            color: '#ffffff',
            bg: isCurrent ? '#1f6feb' : '#238636',
            border: isCurrent ? '#58a6ff' : '#2ea043'
          });
        }
      }

      // Remote Branches (origin/...)
      for (const [remName, remObj] of Object.entries(git.remotes)) {
        for (const [bName, commitId] of remObj.branches.entries()) {
          if (commitId === id) {
            badges.push({
              label: `${remName}/${bName}`,
              color: '#d29922',
              bg: '#2b2111',
              border: '#d29922',
              dashed: true
            });
          }
        }
      }

      // Tags
      for (const [tagName, tagObj] of git.tags.entries()) {
        if (tagObj.commitId === id) {
          badges.push({
            label: `🏷️ ${tagName}`,
            color: '#e3b341',
            bg: '#342913',
            border: '#e3b341'
          });
        }
      }

      // Worktrees
      for (const wt of git.worktrees) {
        if (wt.commitId === id) {
          badges.push({
            label: `📂 ${wt.path}`,
            color: '#d2a8ff',
            bg: '#281c3c',
            border: '#bc8cff'
          });
        }
      }

      // Draw all badges next to this commit node
      let badgeX = pos.x + this.nodeRadius + 14;
      for (const badge of badges) {
        const badgeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        badgeG.setAttribute('transform', `translate(${badgeX}, ${pos.y - 11})`);

        const textLen = badge.label.length * 7.5 + 16;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', textLen);
        rect.setAttribute('height', '22');
        rect.setAttribute('rx', '11');
        rect.setAttribute('fill', badge.bg);
        rect.setAttribute('stroke', badge.border);
        rect.setAttribute('stroke-width', '1.5');
        if (badge.dashed) rect.setAttribute('stroke-dasharray', '3 2');
        badgeG.appendChild(rect);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', textLen / 2);
        text.setAttribute('y', '15');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', badge.color);
        text.setAttribute('font-size', '11');
        text.setAttribute('font-weight', '600');
        text.setAttribute('font-family', "'Fira Code', monospace");
        text.textContent = badge.label;
        badgeG.appendChild(text);

        badgesGroup.appendChild(badgeG);
        badgeX += textLen + 6;
      }
    }
  }

  // Calculate coordinates for DAG nodes
  calculateLayout(commits, git) {
    const positions = new Map();
    // Topological sort from root to leaf
    const roots = [];
    const childrenMap = new Map();

    for (const c of commits) {
      if (!c.parents || c.parents.length === 0) {
        roots.push(c.id);
      } else {
        for (const p of c.parents) {
          if (!childrenMap.has(p)) childrenMap.set(p, []);
          childrenMap.get(p).push(c.id);
        }
      }
    }

    // Assign rows (Y-axis based on topological level)
    const rowMap = new Map();
    const laneMap = new Map();
    let currentLane = 0;

    // BFS or DFS to assign levels
    const visited = new Set();
    const queue = roots.map(id => ({ id, row: 0, lane: 0 }));

    while (queue.length > 0) {
      const { id, row, lane } = queue.shift();
      if (visited.has(id)) {
        if (rowMap.get(id) < row) rowMap.set(id, row);
        continue;
      }
      visited.add(id);
      rowMap.set(id, row);
      if (!laneMap.has(id)) laneMap.set(id, lane);

      const children = childrenMap.get(id) || [];
      for (let i = 0; i < children.length; i++) {
        const childId = children[i];
        const nextLane = i === 0 ? lane : ++currentLane;
        queue.push({ id: childId, row: row + 1, lane: nextLane });
      }
    }

    // Normalize positions
    let maxRow = 0;
    let maxCol = 0;
    for (const [id, row] of rowMap.entries()) {
      const lane = laneMap.get(id) || 0;
      maxRow = Math.max(maxRow, row);
      maxCol = Math.max(maxCol, lane);

      positions.set(id, {
        x: 60 + lane * this.colWidth,
        y: 40 + row * this.rowHeight,
        lane,
        row
      });
    }

    return { positions, maxRow, maxCol };
  }

  // Smooth Cubic Bezier curve
  calculateCurve(x1, y1, x2, y2) {
    if (x1 === x2) {
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.GraphRenderer = GraphRenderer;
}
