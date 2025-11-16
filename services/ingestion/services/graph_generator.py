"""
Graph Generation Service for F1 Analysis Reports
Generates random realistic F1 data visualizations
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from io import BytesIO
import base64
from typing import Dict, List, Tuple
import random

# F1 Theme Colors
F1_RED = '#e10600'
F1_BLACK = '#000000'
F1_WHITE = '#ffffff'
F1_GRAY = '#999999'

class F1GraphGenerator:
    """Generate F1-themed analysis graphs"""
    
    def __init__(self):
        # Set F1 theme style
        plt.style.use('dark_background')
        
    def _setup_plot(self, figsize: Tuple[int, int] = (12, 6)):
        """Setup plot with F1 theme"""
        fig, ax = plt.subplots(figsize=figsize, facecolor=F1_BLACK)
        ax.set_facecolor('#0a0a0a')
        ax.spines['bottom'].set_color(F1_GRAY)
        ax.spines['top'].set_color(F1_GRAY)
        ax.spines['left'].set_color(F1_GRAY)
        ax.spines['right'].set_color(F1_GRAY)
        ax.tick_params(colors=F1_WHITE)
        return fig, ax
    
    def _to_base64(self, fig) -> str:
        """Convert matplotlib figure to base64 string"""
        buffer = BytesIO()
        fig.savefig(buffer, format='png', dpi=100, bbox_inches='tight', 
                   facecolor=F1_BLACK, edgecolor='none')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close(fig)
        return f"data:image/png;base64,{image_base64}"
    
    def generate_confidence_distribution(self) -> str:
        """Generate change detection confidence distribution"""
        fig, ax = self._setup_plot(figsize=(10, 6))
        
        # Generate random confidence scores (skewed toward higher values)
        confidences = np.random.beta(8, 2, 150) * 100
        
        # Create histogram
        n, bins, patches = ax.hist(confidences, bins=20, color=F1_RED, 
                                   alpha=0.7, edgecolor=F1_WHITE, linewidth=0.5)
        
        # Color bars by confidence level
        for i, patch in enumerate(patches):
            bin_center = (bins[i] + bins[i+1]) / 2
            if bin_center < 40:
                patch.set_facecolor('#ff6b6b')  # Low confidence - lighter red
            elif bin_center < 70:
                patch.set_facecolor('#e10600')  # Medium - F1 red
            else:
                patch.set_facecolor('#8b0000')  # High - dark red
        
        ax.set_xlabel('Confidence Score (%)', color=F1_WHITE, fontsize=12, fontweight='bold')
        ax.set_ylabel('Number of Detections', color=F1_WHITE, fontsize=12, fontweight='bold')
        ax.set_title('Change Detection Confidence Distribution', 
                    color=F1_WHITE, fontsize=14, fontweight='bold', pad=20)
        
        # Add grid
        ax.grid(True, alpha=0.2, color=F1_GRAY, linestyle='--', linewidth=0.5)
        
        # Add statistics text
        mean_conf = np.mean(confidences)
        median_conf = np.median(confidences)
        stats_text = f'Mean: {mean_conf:.1f}%\nMedian: {median_conf:.1f}%'
        ax.text(0.02, 0.98, stats_text, transform=ax.transAxes,
               fontsize=10, verticalalignment='top', color=F1_WHITE,
               bbox=dict(boxstyle='round', facecolor=F1_BLACK, alpha=0.8, edgecolor=F1_RED))
        
        return self._to_base64(fig)
    
    def generate_component_damage_chart(self) -> str:
        """Generate component damage severity chart"""
        fig, ax = self._setup_plot(figsize=(12, 7))
        
        # F1 car components with random damage scores
        components = [
            'Rear Wing', 'Front Wing', 'Floor', 'Sidepods', 
            'Diffuser', 'Brake Ducts', 'Suspension', 'Bargeboard',
            'DRS System', 'Engine Cover', 'Tires', 'Halo'
        ]
        
        # Generate realistic damage scores (most components low damage)
        damage_scores = []
        for _ in components:
            if random.random() < 0.7:  # 70% low damage
                damage_scores.append(random.randint(10, 40))
            elif random.random() < 0.9:  # 20% medium damage
                damage_scores.append(random.randint(40, 70))
            else:  # 10% high damage
                damage_scores.append(random.randint(70, 95))
        
        # Create horizontal bar chart
        y_pos = np.arange(len(components))
        bars = ax.barh(y_pos, damage_scores, color=F1_RED, alpha=0.8, 
                      edgecolor=F1_WHITE, linewidth=0.5)
        
        # Color bars by severity
        for bar, score in zip(bars, damage_scores):
            if score < 40:
                bar.set_facecolor('#2ecc71')  # Green - low
            elif score < 70:
                bar.set_facecolor('#f39c12')  # Orange - medium
            else:
                bar.set_facecolor('#e74c3c')  # Red - high
        
        ax.set_yticks(y_pos)
        ax.set_yticklabels(components, color=F1_WHITE)
        ax.set_xlabel('Damage Severity (%)', color=F1_WHITE, fontsize=12, fontweight='bold')
        ax.set_title('Component Damage Analysis', 
                    color=F1_WHITE, fontsize=14, fontweight='bold', pad=20)
        ax.set_xlim(0, 100)
        
        # Add value labels on bars
        for i, (bar, score) in enumerate(zip(bars, damage_scores)):
            ax.text(score + 2, i, f'{score}%', va='center', 
                   color=F1_WHITE, fontsize=9, fontweight='bold')
        
        # Add grid
        ax.grid(True, alpha=0.2, color=F1_GRAY, linestyle='--', linewidth=0.5, axis='x')
        
        # Add legend
        green_patch = mpatches.Patch(color='#2ecc71', label='Low (0-40%)')
        orange_patch = mpatches.Patch(color='#f39c12', label='Medium (40-70%)')
        red_patch = mpatches.Patch(color='#e74c3c', label='High (70-100%)')
        ax.legend(handles=[green_patch, orange_patch, red_patch], 
                 loc='lower right', framealpha=0.9, facecolor=F1_BLACK, edgecolor=F1_RED)
        
        plt.tight_layout()
        return self._to_base64(fig)
    
    def generate_lap_time_evolution(self) -> str:
        """Generate lap time evolution chart"""
        fig, ax = self._setup_plot(figsize=(14, 6))
        
        # Generate lap times (in seconds, around 90s base)
        num_laps = 25
        base_time = 90.0
        lap_times = []
        
        for i in range(num_laps):
            # Add realistic variation
            variation = np.random.normal(0, 0.5)
            # Tire degradation effect (gradual increase)
            degradation = (i / num_laps) * 2.0
            # Occasional slow lap (pit stop or traffic)
            if random.random() < 0.15:
                variation += random.uniform(15, 25)
            
            lap_time = base_time + variation + degradation
            lap_times.append(lap_time)
        
        laps = np.arange(1, num_laps + 1)
        
        # Plot line
        ax.plot(laps, lap_times, color=F1_RED, linewidth=2.5, marker='o', 
               markersize=5, markerfacecolor=F1_WHITE, markeredgecolor=F1_RED, 
               markeredgewidth=1.5, label='Lap Time')
        
        # Add best lap line
        best_lap = min(lap_times)
        ax.axhline(y=best_lap, color='#2ecc71', linestyle='--', linewidth=2, 
                  alpha=0.7, label=f'Best Lap: {best_lap:.3f}s')
        
        # Add average lap line
        avg_lap = np.mean([t for t in lap_times if t < 95])  # Exclude outliers
        ax.axhline(y=avg_lap, color='#3498db', linestyle='--', linewidth=2, 
                  alpha=0.7, label=f'Average: {avg_lap:.3f}s')
        
        ax.set_xlabel('Lap Number', color=F1_WHITE, fontsize=12, fontweight='bold')
        ax.set_ylabel('Lap Time (seconds)', color=F1_WHITE, fontsize=12, fontweight='bold')
        ax.set_title('Lap Time Evolution', 
                    color=F1_WHITE, fontsize=14, fontweight='bold', pad=20)
        
        # Add grid
        ax.grid(True, alpha=0.2, color=F1_GRAY, linestyle='--', linewidth=0.5)
        
        # Legend
        ax.legend(loc='upper left', framealpha=0.9, facecolor=F1_BLACK, 
                 edgecolor=F1_RED, fontsize=10)
        
        # Highlight pit stops
        pit_laps = [i for i, t in enumerate(lap_times) if t > 100]
        if pit_laps:
            for pit_lap in pit_laps:
                ax.scatter(pit_lap + 1, lap_times[pit_lap], color='#f39c12', 
                          s=200, marker='v', edgecolor=F1_WHITE, linewidth=2,
                          zorder=5, label='Pit Stop' if pit_lap == pit_laps[0] else '')
        
        plt.tight_layout()
        return self._to_base64(fig)
    
    def generate_tire_wear_progression(self) -> str:
        """Generate tire wear progression chart"""
        fig, ax = self._setup_plot(figsize=(12, 6))
        
        # Generate tire wear data
        laps = np.arange(0, 26)
        
        # Different wear rates for different tire compounds
        soft_wear = np.array([0 + i * 3.5 + np.random.normal(0, 2) for i in laps])
        medium_wear = np.array([0 + i * 2.5 + np.random.normal(0, 1.5) for i in laps])
        hard_wear = np.array([0 + i * 1.8 + np.random.normal(0, 1) for i in laps])
        
        # Cap at 100%
        soft_wear = np.clip(soft_wear, 0, 100)
        medium_wear = np.clip(medium_wear, 0, 100)
        hard_wear = np.clip(hard_wear, 0, 100)
        
        # Plot tire wear lines
        ax.plot(laps, soft_wear, color='#e74c3c', linewidth=3, marker='s', 
               markersize=6, label='Soft Compound', alpha=0.9)
        ax.plot(laps, medium_wear, color='#f39c12', linewidth=3, marker='o', 
               markersize=6, label='Medium Compound', alpha=0.9)
        ax.plot(laps, hard_wear, color='#ecf0f1', linewidth=3, marker='^', 
               markersize=6, label='Hard Compound', alpha=0.9)
        
        # Add danger zone
        ax.axhspan(80, 100, alpha=0.2, color='red', label='Critical Wear Zone')
        
        ax.set_xlabel('Lap Number', color=F1_WHITE, fontsize=12, fontweight='bold')
        ax.set_ylabel('Tire Wear (%)', color=F1_WHITE, fontsize=12, fontweight='bold')
        ax.set_title('Tire Wear Progression by Compound', 
                    color=F1_WHITE, fontsize=14, fontweight='bold', pad=20)
        ax.set_ylim(0, 105)
        
        # Add grid
        ax.grid(True, alpha=0.2, color=F1_GRAY, linestyle='--', linewidth=0.5)
        
        # Legend
        ax.legend(loc='upper left', framealpha=0.9, facecolor=F1_BLACK, 
                 edgecolor=F1_RED, fontsize=10)
        
        plt.tight_layout()
        return self._to_base64(fig)
    
    def generate_speed_heatmap(self) -> str:
        """Generate speed heatmap across track sections"""
        fig, ax = self._setup_plot(figsize=(14, 8))
        
        # Track sections
        sections = ['Turn 1', 'S1 Straight', 'Turn 2-3', 'S2 Complex', 
                   'Mid Straight', 'Turn 6-7', 'S3 Chicane', 'Final Corner', 
                   'Main Straight']
        
        # Generate speed data for multiple laps
        num_laps = 15
        speed_data = []
        
        for _ in range(num_laps):
            lap_speeds = []
            for section in sections:
                if 'Straight' in section:
                    base_speed = random.randint(280, 330)
                elif 'Complex' in section or 'Chicane' in section:
                    base_speed = random.randint(140, 180)
                else:
                    base_speed = random.randint(180, 240)
                
                lap_speeds.append(base_speed + random.randint(-10, 10))
            speed_data.append(lap_speeds)
        
        speed_data = np.array(speed_data)
        
        # Create heatmap
        im = ax.imshow(speed_data.T, cmap='RdYlGn', aspect='auto', 
                      interpolation='nearest', vmin=140, vmax=330)
        
        # Set ticks and labels
        ax.set_xticks(np.arange(num_laps))
        ax.set_yticks(np.arange(len(sections)))
        ax.set_xticklabels([f'L{i+1}' for i in range(num_laps)], color=F1_WHITE)
        ax.set_yticklabels(sections, color=F1_WHITE)
        
        ax.set_xlabel('Lap Number', color=F1_WHITE, fontsize=12, fontweight='bold')
        ax.set_ylabel('Track Section', color=F1_WHITE, fontsize=12, fontweight='bold')
        ax.set_title('Speed Distribution Across Track Sections', 
                    color=F1_WHITE, fontsize=14, fontweight='bold', pad=20)
        
        # Add colorbar
        cbar = plt.colorbar(im, ax=ax)
        cbar.set_label('Speed (km/h)', rotation=270, labelpad=20, 
                      color=F1_WHITE, fontsize=11, fontweight='bold')
        cbar.ax.yaxis.set_tick_params(color=F1_WHITE)
        plt.setp(plt.getp(cbar.ax.axes, 'yticklabels'), color=F1_WHITE)
        
        # Add values on cells
        for i in range(num_laps):
            for j in range(len(sections)):
                text = ax.text(i, j, int(speed_data[i, j]),
                             ha="center", va="center", color="black", 
                             fontsize=7, fontweight='bold')
        
        plt.tight_layout()
        return self._to_base64(fig)
    
    def generate_performance_radar(self) -> str:
        """Generate performance radar chart"""
        fig, ax = plt.subplots(figsize=(10, 10), subplot_kw=dict(projection='polar'),
                              facecolor=F1_BLACK)
        ax.set_facecolor('#0a0a0a')
        
        # Performance metrics
        categories = ['Speed', 'Braking', 'Cornering', 'Acceleration', 
                     'Tire Management', 'Fuel Efficiency', 'Consistency', 'Overtaking']
        num_vars = len(categories)
        
        # Generate scores (0-100)
        scores = [random.randint(70, 98) for _ in categories]
        
        # Compute angle for each axis
        angles = np.linspace(0, 2 * np.pi, num_vars, endpoint=False).tolist()
        scores += scores[:1]
        angles += angles[:1]
        
        # Plot
        ax.plot(angles, scores, color=F1_RED, linewidth=3, linestyle='solid')
        ax.fill(angles, scores, color=F1_RED, alpha=0.25)
        
        # Fix axis to go in the right order
        ax.set_theta_offset(np.pi / 2)
        ax.set_theta_direction(-1)
        
        # Draw axis lines for each angle and label
        ax.set_xticks(angles[:-1])
        ax.set_xticklabels(categories, color=F1_WHITE, size=11, fontweight='bold')
        
        # Set y-axis
        ax.set_ylim(0, 100)
        ax.set_yticks([25, 50, 75, 100])
        ax.set_yticklabels(['25', '50', '75', '100'], color=F1_GRAY, size=10)
        
        # Add grid
        ax.grid(True, color=F1_GRAY, linestyle='--', linewidth=0.5, alpha=0.5)
        
        # Title
        ax.set_title('Overall Performance Analysis', 
                    color=F1_WHITE, fontsize=16, fontweight='bold', pad=30)
        
        plt.tight_layout()
        return self._to_base64(fig)
    
    def generate_all_graphs(self) -> Dict[str, str]:
        """Generate all graphs and return as base64 encoded images"""
        print("🎨 Generating F1 analysis graphs...")
        
        graphs = {
            'confidence_distribution': self.generate_confidence_distribution(),
            'component_damage': self.generate_component_damage_chart(),
            'lap_times': self.generate_lap_time_evolution(),
            'tire_wear': self.generate_tire_wear_progression(),
            'speed_heatmap': self.generate_speed_heatmap(),
            'performance_radar': self.generate_performance_radar()
        }
        
        print(f"✅ Generated {len(graphs)} graphs successfully!")
        return graphs


def generate_graphs() -> Dict[str, str]:
    """
    Convenience function to generate all F1 analysis graphs
    
    Returns:
        Dict mapping graph names to base64-encoded image strings
    """
    generator = F1GraphGenerator()
    return generator.generate_all_graphs()


if __name__ == "__main__":
    # Test graph generation
    print("Testing F1 Graph Generator...")
    graphs = generate_graphs()
    
    print("\n📊 Generated Graphs:")
    for name, data in graphs.items():
        print(f"  ✓ {name}: {len(data)} bytes")
    
    print("\n✅ Graph generation test complete!")
