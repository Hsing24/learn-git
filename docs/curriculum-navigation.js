window.CURRICULUM_NAVIGATION = {
  isWebPlayable(scenario) {
    return Boolean(scenario) && scenario.cliOnly !== true;
  },
  countWebPlayable(scenarios) {
    return scenarios.filter(scenario => this.isWebPlayable(scenario)).length;
  },
  nextWebPlayableIndex(scenarios, afterIndex, predicate = () => true) {
    const startIndex = Number.isInteger(afterIndex) ? afterIndex + 1 : 0;
    for (let index = startIndex; index < scenarios.length; index++) {
      if (this.isWebPlayable(scenarios[index]) && predicate(scenarios[index], index)) return index;
    }
    return -1;
  },
  nextWebProgressionIndex(scenarios, afterIndex, completedIds) {
    const nextIndex = this.nextWebPlayableIndex(scenarios, afterIndex);
    if (nextIndex !== -1) return nextIndex;
    if (!completedIds.has(scenarios[afterIndex]?.id)) return -1;
    return scenarios.findIndex((scenario, index) =>
      index !== afterIndex && this.isWebPlayable(scenario) && !completedIds.has(scenario.id)
    );
  }
};
