<script setup>
import { computed, ref, watch } from "vue"
import {useAppStore} from "@/stores/app.js";
import {structureManuscripts} from "@/services/ApiServices.js";

const store = useAppStore()


// the selected manuscript from the list in the left
const selectedManuscript = computed(()=>{
  return store.getSelCreatedManuscript
})

const fileContent = computed(()=>{
  return store.recentFileContent.content
})

// check for file update and resets
watch(fileContent, async(newV, oldV)=>{
  console.log("in list of created of manuscripts ==== the uploaded file has changed time to reset:", newV)
  selManuscript.value = null
  // store.setSelCreatedManuscript(null)
  manuscripts.value = []
})

// is updated on user selection. Indicated the selected manuscript in the list of created manuscripts
const selManuscript = ref(null)

watch(selManuscript,async(newV, oldV)=>{
  console.log("sel manuscript newV: ", newV, "oldV:", oldV)
  if(newV.length >0) {
    console.log(" there is a newV:", newV)
    await store.setSelCreatedManuscript(newV[0])
  } else {
    console.log("there is not!!!", newV)
    await store.setSelCreatedManuscript(null)
  }

})


// flattens the work_folia object to a simple list of properties.
const flattenObject = (obj)=> {
    for (let key in obj) {
      if (key !== 'work_folia'){
        if (obj.hasOwnProperty(key) && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key] !== null) {
            let nestedObj = obj[key];
            for (let nestedKey in nestedObj) {
                if (nestedObj.hasOwnProperty(nestedKey)) {
                    obj[`${key}_${nestedKey}`] = nestedObj[nestedKey];
                }
            }
            delete obj[key]; // Optionally delete the original nested object
        }
      }

    }
    return obj;
}

// reformats the content of properties containing arrays or objects. their value is set to JSON strings.
const reformat = (obj)=>{
  for (let key in obj) {
    if (obj.hasOwnProperty(key)){
      obj[`${key}`] = {
         'value': key === 'work_folia'?JSON.stringify(obj[key]) : obj[key],
          'disabled': true,
      }
    }
  }
  return obj
}

// show the tooltip
const showTooltip = ref(false)

// the list containing the manuscripts which were added by the user. These manuscripts will be sent to the Agent for
// structuring
const manuscripts = ref([])

// adding a new manuscript when the user presses the 'addManuscript' button
const addManuscript = ()=>{
  manuscripts.value.push({ title: getNextTitle(), content:null})
}

// removes the clicked manuscript from the list of available manuscripts
const removeManuscript = (index)=> {

  console.log("about to remove: ", manuscripts.value[index], index, selectedManuscript.value )
  manuscripts.value.splice(index,1)
  console.log("after removal:", manuscripts.value)
  // selManuscript.value = null
  // store.setSelCreatedManuscript(null)
}

// loading indicator for the 'structure content' button
const loading = ref(false)

// send the created manuscripts to the Agent
const sendDataToAgents = async() => {
  loading.value = true
  let manData = {}
  manuscripts.value.forEach((m)=>{
    manData[m.title] = m.content
  })
  console.log("manData", manData)

  try {
    const jsonData = await structureManuscripts(manData)

    // the structured data is expected here.

    const resp = await JSON.parse(jsonData.response)

    if (resp.manuscripts){
      resp.manuscripts.forEach((m)=>{
        flattenObject(m)
        reformat(m)
      })

      store.setStructuredData({
        "manuscripts": resp.manuscripts,
        "number_of_manuscripts": resp?.all_data?.manuscripts_analyzed
      })
    }else {
      // when the user creates one manuscript, the llm returns a single object instead of an array.
      flattenObject(resp)
      reformat(resp)
      store.setStructuredData({
        "manuscripts": new Array(resp),
        "number_of_manuscripts": resp?.all_data?.manuscripts_analyzed
      })
    }

    store.setNotification({color:'teal', showNot: true, text: 'The data was structured successfully!'})
    loading.value = false

  } catch (error) {
    store.setNotification({color:'red', showNot: true,text:`${error}. There was an issue with the structuring of the data.`})
    loading.value = false
  }
}

// get the highest id of the available manuscripts and sets the id of the new manuscript increased by one.
// consistency reasons, while creating new manuscripts.
const getNextTitle = () => {
  const highestNumber = manuscripts.value.reduce((max, obj) => {
    const number = parseInt(obj.title.split(' ')[1]);
    return number > max ? number : max;
  }, 0);
  return `Manuscript ${highestNumber + 1}`;
};


</script>

<template>
  <div id="created-manuscripts">
    <v-card variant="text" subtitle="Created manuscripts">
      <div id="card-content">
        <v-list
          v-model:selected="selManuscript"
          bg-color="white"
          class="mt-0 pt-0"
          max-height="600"
        >
<!--          <v-list-subheader>CREATED MANUSCRIPTS</v-list-subheader>-->
          <div v-if="manuscripts.length>0">
            <v-list-item
              v-for="(man,index) in manuscripts"
              :key="'manuscript'+index"
              :title="`Manuscript ${index+1}`"
              :value="man"
              color="primary"
              nav
            >
              <template #prepend>
                <v-avatar color="grey-lighten-1">
                  <v-icon>mdi-book-open-blank-variant-outline</v-icon>
                </v-avatar>
              </template>
              <template #append>
                <v-icon @click="removeManuscript(index)">
                  mdi-close-circle-outline
                </v-icon>
              </template>
            </v-list-item>
          </div>
          <div v-else class="pa-4">
            You have not created any manuscripts yet!
          </div>
          <div class="text-center">
            <v-tooltip v-model="showTooltip" location="top">
              <template v-slot:activator="{props}">
                <v-btn  icon v-bind="props" size="small" @click="addManuscript">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </template>
              <span>Create a manuscript. It is advised to create up to five manuscripts.</span>
            </v-tooltip>
          </div>
        </v-list>
        <v-card-actions class="justify-center">
          <v-btn
            variant="flat"
            class="btn"
            color="primary"
            :loading="loading"
            @click="sendDataToAgents"
            :disabled="!manuscripts.every(m=> m.content !== null)"
          >
            Structure content
            <v-tooltip
              activator="parent"
              location="top"
            >
              <span>Send the created manuscripts to be structured.</span>
            </v-tooltip>
          </v-btn>
        </v-card-actions>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
#card-content{
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 660px;
}
</style>
