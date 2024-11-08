release_prod() {
  local server_ip="157.245.85.181"
  local build_dir="release/build"
  local files_to_zip=()

  for file in "$build_dir"/*; do
    if [[ -f "$file" && ! "$file" =~ mac$ && ! "$file" =~ mac-arm64$ ]]; then
      files_to_zip+=("${file##*/}")
    fi
  done

  if [ ${#files_to_zip[@]} -eq 0 ]; then
    echo "No files found to zip in $build_dir"
    return 1
  fi

  echo "Files to zip:"
  for file in "${files_to_zip[@]}"; do
    echo "$file"
  done

  # https://www.7-zip.org/
  (cd "$build_dir" && "C:/Progra~1/7-Zip/7z.exe" a ../build.zip "${files_to_zip[@]}")

  # Upload the zip file to the server
  scp release/build.zip root@$server_ip:/root/shim-layer/webapp/updates
  ssh root@$server_ip 'unzip /root/shim-layer/webapp/updates/build.zip -d /root/shim-layer/webapp/updates/production && rm /root/shim-layer/webapp/updates/build.zip'
}

release_prod
