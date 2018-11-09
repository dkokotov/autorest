/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as aio from '@microsoft.azure/async-io';
import * as datastore from '@microsoft.azure/datastore';

import * as assert from 'assert';
import { only, skip, slow, suite, test, timeout } from 'mocha-typescript';

import { MultiAPIMerger } from '../lib/pipeline/plugins/merger';
import { FastStringify } from '@microsoft.azure/datastore';

require('source-map-support').install();

const resources = `${__dirname}../../../test/resources/merger`;

@suite class TestShaker {

  @test async 'Test Merger'() {

    const inputUri = 'mem://input.yaml';
    // const outputUri = 'mem://output.yaml';

    const input = await aio.readFile(`${resources}/input.yaml`);
    // const output = await aio.readFile(`${resources}/output.yaml`);

    const map = new Map<string, string>([[inputUri, input]]);
    //const map = new Map<string, string>([[inputUri, input], [outputUri, output]]);
    const mfs = new datastore.MemoryFileSystem(map);

    const cts: datastore.CancellationTokenSource = { cancel() { }, dispose() { }, token: { isCancellationRequested: false, onCancellationRequested: <any>null } };
    const ds = new datastore.DataStore(cts.token);
    const scope = ds.GetReadThroughScope(mfs);
    const inputDataHandle = await scope.Read(inputUri);
    // const outputDataHandle = await scope.Read(outputUri);

    assert(inputDataHandle != null);
    // assert(outputDataHandle != null);

    // if (inputDataHandle && outputDataHandle) {
    if (inputDataHandle) {
      // const outputObject = outputDataHandle.ReadObject();
      const processor = new MultiAPIMerger([inputDataHandle]);

      const sink = ds.getDataSink();

      const data = await sink.WriteObject('merged oai3 doc...', processor.output, inputDataHandle.Identity, 'merged-oai3', processor.sourceMappings, [inputDataHandle]);



      // testing: dump out the converted file
      //console.log(FastStringify(processor.output));

      // console.log(JSON.stringify(data.ReadMetadata().sourceMap.Value));

      await aio.writeFile("c:/tmp/input.yaml", input);
      await aio.writeFile("c:/tmp/output.yaml", FastStringify(processor.output));
      await aio.writeFile("c:/tmp/output.yaml.map", JSON.stringify(data.ReadMetadata().sourceMap.Value));


      // assert.deepEqual(shaker.output, outputObject, 'Should be the same');
    }
  }
}