import sys
from PIL import Image

def split_image(img_path, out_dir):
    img = Image.open(img_path)
    w, h = img.size
    w2, h2 = w // 2, h // 2
    
    # top-left
    img.crop((0, 0, w2, h2)).save(f"{out_dir}/slide1.png")
    # top-right
    img.crop((w2, 0, w, h2)).save(f"{out_dir}/slide2.png")
    # bottom-left
    img.crop((0, h2, w2, h)).save(f"{out_dir}/slide3.png")
    # bottom-right
    img.crop((w2, h2, w, h)).save(f"{out_dir}/slide4.png")

if __name__ == "__main__":
    split_image(sys.argv[1], sys.argv[2])
