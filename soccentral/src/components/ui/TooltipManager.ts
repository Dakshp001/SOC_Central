// Global tooltip manager - ensures only one tooltip shows at a time
class TooltipManager {
  private activeTooltipId: string | null = null;
  private callbacks: Map<string, () => void> = new Map();

  setActiveTooltip(id: string, hideCallback: () => void) {
    // Hide the currently active tooltip if it's different
    if (this.activeTooltipId && this.activeTooltipId !== id) {
      const hideCurrentTooltip = this.callbacks.get(this.activeTooltipId);
      if (hideCurrentTooltip) {
        hideCurrentTooltip();
      }
    }
    
    // Set the new active tooltip
    this.activeTooltipId = id;
    this.callbacks.set(id, hideCallback);
  }

  hideTooltip(id: string) {
    if (this.activeTooltipId === id) {
      this.activeTooltipId = null;
    }
    this.callbacks.delete(id);
  }

  hideAllTooltips() {
    this.callbacks.forEach((callback) => callback());
    this.activeTooltipId = null;
    this.callbacks.clear();
  }

  isActive(id: string): boolean {
    return this.activeTooltipId === id;
  }
}

// Export a singleton instance
export const tooltipManager = new TooltipManager();