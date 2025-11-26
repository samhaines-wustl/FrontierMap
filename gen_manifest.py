# import OS module
import os
import json
# Get the list of all files and directories
path = "./json/locations"
dir_list = os.listdir(path)
# prints all files
cleaned_list = [file for file in dir_list if '.json' in file]
#print("Files and directories in '", path, "' :")
#print(cleaned_list)

with open("./json/manifest.json", 'w') as outfile:
    json.dump(cleaned_list, outfile, indent=2)


# Get list of all ids from all locations
id_list = [json.load(open(path + '/' + j))['id'] for j in cleaned_list]

# Set up admin profile locations
with open("./json/profiles/admin.json", "r+") as admin_file:
    data = json.load(admin_file)
    data['locations_found'] = id_list
    admin_file.seek(0)
    json.dump(data, admin_file, indent=2)