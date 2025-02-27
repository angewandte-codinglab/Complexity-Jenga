import os

def get_hdr_files():
    # List all files in the current directory
    files = os.listdir('.')
    # Filter files to only include those ending with .hdr (case-insensitive)
    hdr_files = [file for file in files if file.lower().endswith('.png')]
    return hdr_files

if __name__ == "__main__":
    hdr_list = get_hdr_files()
    print(hdr_list)