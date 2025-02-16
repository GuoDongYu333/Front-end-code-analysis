import fs from "fs";
import path from "path";
import { VUETEMPTSDIR } from "./lib/constant.js";
import { mkDir, rmDir } from "./lib/file.js";
import { parseTs, parseVue } from "./lib/parse.js";


