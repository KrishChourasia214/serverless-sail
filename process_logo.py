#!/usr/bin/env python3
"""
Script to process the SAIL logo image and remove the black background.
This will create a PNG with transparent background.
"""

from PIL import Image
import sys
import os

def remove_background(input_path, output_path, threshold=30):
    """
    Remove black/dark background from an image and make it transparent.
    
    Args:
        input_path: Path to input image
        output_path: Path to save output PNG with transparency
        threshold: Pixels darker than this will be made transparent (0-255)
    """
    try:
        # Open the image
        img = Image.open(input_path)
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Get image data
        data = img.getdata()
        
        # Create new image data with transparency
        new_data = []
        for item in data:
            # Check if pixel is dark (black background)
            # Using average of RGB values
            avg_color = sum(item[:3]) / 3
            
            if avg_color < threshold:
                # Make transparent (alpha = 0)
                new_data.append((0, 0, 0, 0))
            else:
                # Keep original pixel
                new_data.append(item)
        
        # Update image with new data
        img.putdata(new_data)
        
        # Save as PNG with transparency
        img.save(output_path, 'PNG')
        print(f"✅ Successfully processed logo!")
        print(f"   Input: {input_path}")
        print(f"   Output: {output_path}")
        print(f"   Size: {img.size[0]}x{img.size[1]} pixels")
        
    except Exception as e:
        print(f"❌ Error processing image: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Default paths
    input_file = "public/assets/sail-logo.png"
    output_file = "public/assets/sail-logo-transparent.png"
    
    # Allow command line arguments
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"❌ Error: Input file not found: {input_file}")
        print("\nUsage: python process_logo.py [input_path] [output_path]")
        print(f"Example: python process_logo.py public/assets/sail-logo.png public/assets/sail-logo-transparent.png")
        sys.exit(1)
    
    # Process the image
    remove_background(input_file, output_file, threshold=30)
    
    print("\n💡 Tip: You can adjust the threshold (default 30) in the script")
    print("   Lower threshold = more aggressive background removal")
    print("   Higher threshold = keeps more of the image")

