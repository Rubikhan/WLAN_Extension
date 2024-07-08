#define _CRT_SECURE_NO_WARNINGS
#include "WLANExtension.h"
#include <fstream>
#include <locale>
#include <codecvt>
#include <cstdio>
#include <string>
#include <iostream>
#include <windows.h>
#include <fcntl.h>  // for _wcreat

const int DEFAULT_NO_OF_LINES = 5;
const int MAX_NO_OF_LINES = 50;

int NO_OF_LINES = DEFAULT_NO_OF_LINES;

// Path for the log file
const std::wstring LOG_FILE_PATH = L"C:\\temp\\dll_debug_log.txt";

// Log function to write messages to the log file
void log(const std::string& message) {
    std::ofstream logFile(LOG_FILE_PATH, std::ios_base::app);
    if (logFile.is_open()) {
        logFile << message << std::endl;
        logFile.close();
    }
}

// Convert a wide string to a narrow string
std::string to_string(const std::wstring& wstr) {
    int size_needed = WideCharToMultiByte(CP_UTF8, 0, wstr.c_str(), (int)wstr.size(), NULL, 0, NULL, NULL);
    std::string strTo(size_needed, 0);
    WideCharToMultiByte(CP_UTF8, 0, wstr.c_str(), (int)wstr.size(), &strTo[0], size_needed, NULL, NULL);
    return strTo;
}

// read the number of lines from the configuration file
void ReadConfig() {
    std::ifstream configFile("../node/public/config.txt");
    if (configFile.is_open()) {
        std::string line;
        while (std::getline(configFile, line)) {
            // Assuming the config file has a line like: NO_OF_LINES=10
            size_t pos = line.find("NO_OF_LINES=");
            if (pos != std::string::npos) {
                int lines = std::stoi(line.substr(pos + 12));
                NO_OF_LINES = (lines > 0 && lines <= MAX_NO_OF_LINES) ? lines : DEFAULT_NO_OF_LINES;
                log("Configured NO_OF_LINES: " + std::to_string(NO_OF_LINES));
            }
        }
        configFile.close();
    }
    else {
        log("Failed to open config file");
    }
}

// check if a file exists
bool file_exists(const std::wstring& name) {
    DWORD dwAttrib = GetFileAttributesW(name.c_str());
    return (dwAttrib != INVALID_FILE_ATTRIBUTES && !(dwAttrib & FILE_ATTRIBUTE_DIRECTORY));
}

// convert a string to a wide string
std::wstring to_wstring(const std::string& str) {
    int size_needed = MultiByteToWideChar(CP_UTF8, 0, str.c_str(), (int)str.size(), NULL, 0);
    std::wstring wstrTo(size_needed, 0);
    MultiByteToWideChar(CP_UTF8, 0, str.c_str(), (int)str.size(), &wstrTo[0], size_needed);
    return wstrTo;
}

// copy content from one file to another
void copy_file_content(const std::wstring& src, const std::wstring& dst) {
    std::wifstream srcFile(src);
    std::wofstream dstFile(dst);
    if (srcFile.is_open() && dstFile.is_open()) {
        dstFile << srcFile.rdbuf();
        srcFile.close();
        dstFile.close();
    }
}

// ensure the correct number of line files exist
void EnsureLineFiles() {
    for (int i = 1; i <= NO_OF_LINES; ++i) {
        std::string fileName = "../node/public/text/line" + std::to_string(i);
        std::wstring wFileName = to_wstring(fileName);
        if (!file_exists(wFileName)) {
            _wcreat(wFileName.c_str(), _S_IREAD | _S_IWRITE); // Create the file if it doesn't exist
            log("Created file: " + fileName);
        }
    }

    // Remove extra files if NO_OF_LINES is decreased
    for (int i = NO_OF_LINES + 1; i <= MAX_NO_OF_LINES; ++i) {
        std::string fileName = "../node/public/text/line" + std::to_string(i);
        std::wstring wFileName = to_wstring(fileName);
        if (file_exists(wFileName)) {
            _wremove(wFileName.c_str());
            log("Removed file: " + fileName);
        }
    }
}

BOOL WINAPI DllMain(HMODULE hModule, DWORD ul_reason_for_call, LPVOID lpReserved)
{
    return TRUE;
}

bool ProcessSentence(std::wstring& sentence, SentenceInfo sentenceInfo)
{
    // Read the configuration file to get the latest NO_OF_LINES value
    ReadConfig();

    // Ensure the correct number of line files exist
    EnsureLineFiles();

    if (sentenceInfo["current select"]) {
        std::string oldestLine_ = "../node/public/text/line" + std::to_string(NO_OF_LINES);
        std::wstring wOldestLine = to_wstring(oldestLine_);
        _wremove(wOldestLine.c_str());
        log("Removed oldest line: " + oldestLine_);

        for (int i = NO_OF_LINES; i > 1; i--) {
            std::string oldName_ = "../node/public/text/line" + std::to_string(i - 1);
            std::wstring wOldName = to_wstring(oldName_);
            std::string newName_ = "../node/public/text/line" + std::to_string(i);
            std::wstring wNewName = to_wstring(newName_);
            copy_file_content(wOldName, wNewName);
            log("Copied content from " + oldName_ + " to " + newName_);
        }
        const std::locale utf8_locale = std::locale(std::locale(), new std::codecvt_utf8<wchar_t>());
        std::wofstream newestLine(L"../node/public/text/line1");
        if (newestLine.is_open()) {
            newestLine.imbue(utf8_locale);
            newestLine << sentence;
            newestLine.close();
            log("Wrote to line1: " + to_string(sentence));
        }
    }
    return false;
}
