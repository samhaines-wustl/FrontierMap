# import OS module
import os
import json
# Get the list of all files and directories
path = "./json/locations"
dir_list = os.listdir(path)
print("Files and directories in '", path, "' :")
# prints all files
cleaned_list = [file for file in dir_list if '.json' in file]
print(cleaned_list)

with open("./json/manifest.json", 'w') as outfile:
    json.dump(cleaned_list, outfile, indent=2)